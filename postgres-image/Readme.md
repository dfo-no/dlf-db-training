# Stack Overflow 2010 course database

Postgres 18 image with data from stack overflow 2010

## Build locally

Place `dump-stackoverflow2010-202408101013.sql` in `data/` before building. The
dump is git ignored but you can download it from [my one drive](https://dirfo-my.sharepoint.com/:u:/g/personal/erik_prestegard_dfo_no/IQB0uRe3O7RFSpkOudrxHQ_mAfe3Z608MGzwES_c4tA8ph8?e=dsQ2ZT) :)

```sh
docker build -t dlf-training-stackoverflow2010:latest .
```

## Publish to Azure Container Registry

Run the following in PowerShell after building. Replace `myregistry` with your
existing ACR name. The login server is read from Azure to support registries
whose hostname contains a generated suffix.

```sh
docker build -t dlfdevacr.azurecr.io/dlf-training-stackoverflow2010:latest .
az acr login --name dlfdevacr
docker push dlfdevacr.azurecr.io/dlf-training-stackoverflow2010:latest
```

## Credits
The database is a dump from [StackOverflow.com](https://stackoverflow.com/) and the database dump was constructed by Brent Ozar </br>
If you're looking for more Postgres courses check out his [website](https://www.brentozar.com/archive/category/postgresql/)
