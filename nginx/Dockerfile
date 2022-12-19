FROM nginx

RUN mkdir -p /etc/nginx/certs
COPY run_nginx.sh /etc/nginx/run_nginx.sh
COPY fullchain.pem /etc/nginx/certs/fullchain.pem
COPY privkey.pem /etc/nginx/certs/privkey.pem
ADD ./html/* /usr/share/nginx/html/

