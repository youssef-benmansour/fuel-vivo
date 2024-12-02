# db/Dockerfile

FROM postgres:13

# Set environment variables
ENV DB_NAME=fuel_delivery
ENV DB_USER=admin
ENV DB_PASSWORD=adminpassword
ENV DB_HOST=db
ENV DB_PORT=5432

# Give execution rights on the docker-entrypoint-initdb.d folder
RUN chmod -R 0755 /docker-entrypoint-initdb.d/

COPY init.sql /docker-entrypoint-initdb.d/

