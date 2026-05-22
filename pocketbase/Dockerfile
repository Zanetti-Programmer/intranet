FROM alpine:3.19

ARG PB_VERSION=0.22.30

RUN apk add --no-cache ca-certificates wget unzip

# Detecta arquitetura e baixa o binário correto
RUN ARCH=$(uname -m) && \
    case "$ARCH" in \
      x86_64)          PB_ARCH="amd64" ;; \
      aarch64|arm64)   PB_ARCH="arm64" ;; \
      *) echo "Arquitetura não suportada: $ARCH" && exit 1 ;; \
    esac && \
    wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" \
        -O /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /pb/ && \
    rm /tmp/pb.zip && \
    chmod +x /pb/pocketbase

WORKDIR /pb
COPY pb_hooks/ /pb/pb_hooks/
VOLUME ["/pb/pb_data"]
EXPOSE 8090
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data"]
