# Estados da doação — versão original gerada pela IA

Gerada pelo Claude em 07/10/2026, sem correções. A IA entregou o diagrama como imagem; este arquivo é a transcrição em Mermaid com os mesmos elementos, incluindo os erros analisados no README.

```mermaid
stateDiagram-v2
    direction LR
    state "Disponível" as Disponivel
    state "Aceita" as Aceita
    state "Cancelada" as Cancelada
    state "Retirada" as Retirada

    Disponivel : aparece na lista
    Aceita : reservada para uma ONG
    Cancelada : estado final
    Retirada : estado final

    [*] --> Disponivel : publicar (dados válidos)
    Disponivel --> Aceita : ONG aceita
    Aceita --> Disponivel : X horas sem retirada
    Disponivel --> Cancelada : doador cancela
    Aceita --> Cancelada : coordenação cancela
    Aceita --> Retirada : ONG confirma retirada
    Aceita --> Aceita : outra ONG - recusado

    classDef planejado stroke-dasharray: 5 5
    class Cancelada, Retirada planejado
```

Estados tracejados: planejados.
