FROM debian:12-slim

RUN apt-get update && apt-get install -y \
    nginx \
    openssl \
    && rm -rf /var/lib/apt/lists/*

COPY conf/nginx.conf /etc/nginx/nginx.conf
COPY tools/init_nginx.sh /init_nginx.sh
RUN chmod +x /init_nginx.sh

EXPOSE 443

ENTRYPOINT ["/init_nginx.sh"]
