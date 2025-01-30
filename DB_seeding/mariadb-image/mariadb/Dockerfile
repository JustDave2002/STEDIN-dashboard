#FROM mariadb:10.5
#
## Copy initialization SQL script
#COPY initdb /docker-entrypoint-initdb.d
#
## Expose MariaDB default port
#EXPOSE 3306
#
## Use --skip-grant-tables
#CMD ["mysqld", "--skip-grant-tables", "--skip-networking"]

FROM mariadb:10.5

# Copy the custom entrypoint script
COPY custom-entrypoint.sh /usr/local/bin/

# Make sure the script is executable
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

# Copy initialization SQL script
COPY initdb /docker-entrypoint-initdb.d/

# Expose MariaDB default port
EXPOSE 3306

# Set the custom entrypoint script
ENTRYPOINT ["custom-entrypoint.sh"]