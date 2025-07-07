ARG VARIANT=latest
FROM oven/bun:${VARIANT}

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
  && apt-get -y install --no-install-recommends \
  ca-certificates \
  curl \
  git \
  vim-nox \
  wget \
  xz-utils \
  && apt-get auto-remove -y \
  && apt-get clean -y

RUN chsh -s $(which bash) bun
RUN curl -sS https://starship.rs/install.sh | sh /dev/stdin --yes \
  && echo 'eval "$(starship init bash)"' >> /home/bun/.bashrc
# && echo 'export PS1="\e[01;32m\u\e[m:\e[01;34m\w\e[m\$ "' >> /home/bun/.bashrc

USER bun
