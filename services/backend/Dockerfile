FROM denoland/deno:2.7.5

WORKDIR /app
RUN chown deno:deno /app
USER deno

COPY --chown=deno:deno deno.json deno.lock ./
COPY --chown=deno:deno src ./src
RUN deno cache --frozen src/main.ts

EXPOSE 5001
CMD ["deno", "task", "start"]
