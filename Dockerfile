FROM ruby:2.3
MAINTAINER Cristhian Parra <cdparra@gmail.com>

RUN gem update --system && gem install compass sass haml && mkdir -p /var/www/html && apt-get update && apt-get install -y apache2 curl sudo && curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - && apt-get install nodejs
COPY docker_confs/ports.conf /etc/apache2/ports.conf
ADD docker_confs/000-default.conf /etc/apache2/sites-available/
RUN mkdir -p /opt/appcivist/files && mkdir -p /var/www/html/appcivist-pb && a2enmod proxy && a2enmod proxy_http && service apache2 restart && npm i npm@latest -g && npm install grunt -g && npm install bower -g && npm install grunt-cli -g
COPY docker_confs/deploy.sh /tmp/deploy.sh
COPY . appcivist-pb-client
EXPOSE 8081
RUN bash /tmp/deploy.sh
CMD apachectl -k start -D FOREGROUND
