FROM node:20.19.1-bookworm

# Install some extras such as vim for interactive rebases. Also some
# Cypress prerequisites for running in Debian containers:
# https://docs.cypress.io/app/get-started/install-cypress#UbuntuDebian
# and we set up k6 for performance testing
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        libasound2 \
        libgbm-dev \
        libgtk-3-0 \
        libgtk2.0-0 \
        libnotify-dev \
        libnss3 \
        libxss1 \
        libxtst6 \
        vim \
        xauth \
        xvfb \
    && apt-get clean
