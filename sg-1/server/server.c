#include "mongoose.h"
#include <sys/mman.h>
#include <ctype.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <time.h>
#include <stdio.h>

#define kSourceFileCountMax  (4*1024)
#define kPathLengthMax       (512)
#define kSourceFileLengthMax (8*1024)
#define kOutputBufferSize    (16*1024)

struct Source
{
  int32_t pathCount;
  char    paths[kSourceFileCountMax][kPathLengthMax];
  char    text[kSourceFileCountMax][kSourceFileLengthMax];
};
typedef struct Source Source;

static sig_atomic_t               s_signal_received = 0;
static const char*                s_http_port       = "8080";
static struct mg_serve_http_opts  s_http_server_opts;
static const char*                s_source_path     = "data/source.bin";
static Source*                    s_source;
static char                       s_output_buffer[ kOutputBufferSize ];

static void signal_handler(int sig_num)
{
  signal(sig_num, signal_handler);  // Reinstantiate signal handler
  s_signal_received = sig_num;
}

static int has_prefix(const struct mg_str *uri, const struct mg_str *prefix)
{
  return uri->len > prefix->len && memcmp(uri->p, prefix->p, prefix->len) == 0;
}

static int is_equal(const struct mg_str *s1, const struct mg_str *s2)
{
  return s1->len == s2->len && memcmp(s1->p, s2->p, s2->len) == 0;
}

static int is_websocket(const struct mg_connection *nc)
{
  return nc->flags & MG_F_IS_WEBSOCKET;
}

static void load_source_data()
{
  s_source = (Source*)malloc( sizeof(Source) );
  if (s_source == NULL)
  {
    perror("Failed allocation");
    exit(EXIT_FAILURE);
  }

  if( access( s_source_path, F_OK ) == -1 )
  {
    printf("Zero new source file\n");
    memset( s_source, 0, sizeof(Source) );
    return;
  }

  FILE* file = fopen( s_source_path, "rb" );
  if (file == NULL)
  {
    perror("Error opening source for read");
    exit(EXIT_FAILURE);
  }

  if (fread(s_source,sizeof(Source),1,file) == 0)
  {
    perror("Error reading source");
    fclose(file);
    exit(EXIT_FAILURE);
  }

  fclose(file);
  printf("Exists with %d paths\n",s_source->pathCount);
}

static void save_source_data( const char* path )
{
  FILE* file = fopen( path, "wb+" );
  if (file == NULL)
  {
    perror("Error opening source for write");
    exit(EXIT_FAILURE);
  }

  if (fwrite(s_source,sizeof(Source),1,file) == 0)
  {
    perror("Error writing source");
    fclose(file);
    exit(EXIT_FAILURE);
  }

  fclose(file);
  printf("Wrote %d paths to %s\n",s_source->pathCount,path);
}

static int find_path_ndx( const char* path, int path_len )
{
  for (int i=0; i<s_source->pathCount; i++)
  {
    if (strncmp( path, s_source->paths[i], path_len ) == 0)
    {
      return i;
    }
  }
  return -1;
}

static int param_len( const char* msg, int msg_len )
{
  for (int i=0; i<msg_len; i++)
  {
    if (msg[i] == '|')
    {
      return i;
    }
  }
  return -1;
}

static void send_sources( struct mg_connection* nc )
{
  for (int i=0; i<s_source->pathCount; i++)
  {
    printf("SEND %s\n",s_source->paths[i]);
    snprintf( s_output_buffer, kOutputBufferSize, "{ \"cmd\" : \"LOAD\", \"path\" : \"%s\", \"text\" : \"%s\" }", s_source->paths[i],s_source->text[i]);
    int len = strlen( s_output_buffer );
    mg_send_websocket_frame(nc, WEBSOCKET_OP_TEXT, s_output_buffer, len );
  }
}

static void save_archive( void )
{
  char       timestamp[ kPathLengthMax ];
  char       path[ kPathLengthMax ];
  time_t     curtime;
  struct tm* loctime;

  curtime = time(NULL);
  loctime = localtime(&curtime);
  strftime(timestamp, kPathLengthMax, "%Y%m%d-%H%M%S", loctime);

  snprintf( path, kPathLengthMax, "data/source-%s.bin", timestamp );
  save_source_data( path );
}


static void msg_save( const char* p, int len )
{
  const char* path      = p;
  int         path_len =  param_len( p, len );

  if ( path_len == -1 )
  {
    perror("path_len == -1");
    return;
  }
  if ( path_len >= kPathLengthMax )
  {
    perror("path_len too big");
    return;
  }

  p   += path_len+1;
  len -= path_len+1;

  char path_str[kPathLengthMax];

  strncpy( path_str, path, path_len );
  path_str[path_len] = 0;

  int path_ndx = find_path_ndx( path_str, path_len );
  if (path_ndx == -1)
  {
    path_ndx = s_source->pathCount;
    s_source->pathCount++;
    printf("NEW FILE \"%s\" at %d\n", path_str, path_ndx);
    strncpy( s_source->paths[path_ndx], path_str, path_len );
  }

  if (len >= kSourceFileLengthMax)
  {
    perror("source file too big");
    return;
  }

  printf("SAVED %d bytes to \"%s\" (%d)\n", len, path_str, path_ndx);
  memcpy( s_source->text[path_ndx], p, len );
  s_source->text[path_ndx][len] = 0;
}

static void msg_command( struct mg_connection* nc, const char* p, int len )
{
  const char* cmd      = p;
  int         cmd_len =  param_len( p, len );

  if ( cmd_len == -1 )
  {
    perror("cmd_len == -1");
    return;
  }

  p   += (cmd_len+1);
  len -= (cmd_len+1);

  if ( strncmp( cmd, "SAVE", cmd_len ) == 0 )
  {
    msg_save( p, len );
    return;
  }

  if ( strncmp( cmd, "JOIN", cmd_len )  == 0)
  {
    send_sources(nc);
    return;
  }

  if ( strncmp( cmd, "ARCHIVE", cmd_len )  == 0)
  {
    save_archive();
    return;
  }

  printf("UNKNOWN %s\n",cmd);
}

static void ev_handler(struct mg_connection *nc, int ev, void *ev_data)
{
  switch (ev)
  {
  case MG_EV_HTTP_REQUEST:
  {
    mg_serve_http(nc, (struct http_message *) ev_data, s_http_server_opts);
    break;
  }
  case MG_EV_WEBSOCKET_HANDSHAKE_DONE:
  {
#if 0
    /* New websocket connection. */
    // send something...
#endif
    break;
  }
  case MG_EV_WEBSOCKET_FRAME:
  {
    struct websocket_message *wm = (struct websocket_message *) ev_data;
    /* New websocket message. Tell everybody. */
    // struct mg_str d = {(char *) wm->data, wm->size};
    msg_command( nc, wm->data, wm->size );
    fflush(stdout);
    break;
  }
  case MG_EV_CLOSE:
  {
#if 0
    /* Disconnect. Tell everybody. */
    if (is_websocket(nc))
    {
      // send something...
    }
#endif
    break;
  }
  }
}

int main(void)
{
  struct mg_mgr mgr;
  struct mg_connection *nc;

  signal(SIGTERM, signal_handler);
  signal(SIGINT, signal_handler);
  setvbuf(stdout, NULL, _IOLBF, 0);
  setvbuf(stderr, NULL, _IOLBF, 0);

  load_source_data();
  mg_mgr_init(&mgr, NULL);

  nc = mg_bind(&mgr, s_http_port, ev_handler);
  s_http_server_opts.document_root = ".";
  s_http_server_opts.enable_directory_listing = "yes";
  mg_set_protocol_http_websocket(nc);

  printf("Started on port %s\n", s_http_port);
  while (s_signal_received == 0)
  {
    mg_mgr_poll(&mgr, 200);
  }

  mg_mgr_free(&mgr);
  save_source_data( s_source_path );

  return 0;
}
