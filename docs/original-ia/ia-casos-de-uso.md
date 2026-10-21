# Casos de uso — versão original gerada pela IA

Gerada pelo Claude em 07/10/2026, sem correções. A IA entregou o diagrama como imagem; este arquivo é a transcrição em Mermaid com os mesmos elementos, incluindo os erros analisados no README.

```mermaid
flowchart LR
    Doador["Doador<br/>restaurante"]
    ONG["ONG<br/>cozinha comunitária"]
    Marta["Marta<br/>coordenadora"]
    Tempo["Tempo<br/>prazo de X horas"]

    subgraph Sistema["Sistema Prato Cheio"]
        UC1(["Publicar doação"])
        UC2(["Cancelar doação"])
        UC3(["Visualizar disponíveis"])
        UC4(["Aceitar doação"])
        UC5(["Confirmar retirada"])
        UC6(["Aprovar doador"])
        UC7(["Cancelar após aceite"])
        UC8(["Liberar doação não retirada"])
    end

    Doador --- UC1
    Doador --- UC2
    ONG --- UC3
    ONG --- UC4
    ONG --- UC5
    Marta --- UC6
    Marta --- UC7
    Tempo --- UC8

    classDef implementado fill:#E1F5EE,stroke:#0F6E56,color:#085041
    classDef planejado fill:#F1EFE8,stroke:#5F5E5A,color:#444441,stroke-dasharray: 5 5
    class UC1,UC3,UC4 implementado
    class UC2,UC5,UC6,UC7,UC8 planejado
```

Verde: implementado. Cinza tracejado: planejado.
