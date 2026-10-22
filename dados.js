/*
 * Conteúdo do jogo "Fábrica do TaskInput".
 *
 * Aqui ficam só os dados: estações, encaixes, peças, pacotes de teste, dicas
 * e fichas de conceito. Nada aqui mexe na tela. A simulação de cada estação
 * está em motor.js, o celular de saída em visor.js e a tela em jogo.js.
 *
 * Marcação usada nos textos: `assim` vira trecho de código.
 *
 * Estação:
 *   slots      encaixes da esteira, na ordem em que o pacote passa
 *   pecas      bandeja de peças (as certas, uma alternativa ou armadilha)
 *   pacotes    pacotes de teste que passam pela esteira ao ligar
 *   origem     de onde o pacote sai
 *   destino    onde o pacote chega
 *
 * Encaixe:
 *   papel      o que o encaixe precisa fazer (aparece na tela)
 *   certo      id da peça que cumpre o papel
 *   ok         legenda quando o pacote passa por ele ({t} é o texto do pacote)
 *
 * Peça:
 *   tipo       "certa", "alternativa" ou "armadilha"
 *   faz        o que a peça realmente faz (usado quando ela está no lugar errado)
 *   falhaPropria  texto próprio para armadilhas e alternativas
 */
window.DADOS = {
  titulo: "Fábrica do TaskInput",
  dicasPadrao: 6,

  estacoes: [
    /* ------------------------------------------------------------------ */
    {
      id: "memoria",
      nome: "A caixinha de memória",
      cor: "#e8590c",
      pedido:
        "Alguém digita `Comprar pão`. O app precisa guardar o texto, mostrá-lo no campo e refazer a tela a cada troca. Monte a linha.",
      origem: { rotulo: "Teclado", maq: "teclado" },
      destino: { rotulo: "Campo do celular", maq: "campo" },
      mostrarEspacos: false,
      celular0: { texto: "", refeitas: 0 },
      slots: [
        {
          id: "A",
          papel: "Recebe o texto novo e manda refazer a tela",
          curto: "Troca",
          certo: "set",
          ok: { padrao: "`setTaskName('{t}')` troca o valor guardado e avisa o React para refazer a tela." }
        },
        {
          id: "B",
          papel: "Cria a caixinha de memória e guarda o valor",
          curto: "Guarda",
          certo: "state",
          ok: { padrao: "A caixinha criada por `useState` guarda `{t}`. O React acompanha essa caixinha." }
        },
        {
          id: "C",
          papel: "Entrega o valor guardado para a tela",
          curto: "Lê",
          certo: "nome",
          ok: { padrao: "`taskName` entrega `{t}` e o campo mostra o texto." }
        }
      ],
      pecas: [
        {
          id: "set",
          tipo: "certa",
          rotulo: "Função do estado",
          codigo: "setTaskName",
          maq: "funil-troca",
          faz: "troca o valor guardado e manda refazer a tela",
          resumo: "Troca o valor guardado e manda refazer a tela.",
          dica: "Alterar o valor guardado só é permitido por uma porta. Qual das peças da bandeja é uma função?",
          dicaForte: "Cada chamada dessa função agenda uma nova renderização. Procure a peça que recebe o texto novo e manda refazer a tela.",
          pistaErro: "Lembrete: `setTaskName` é uma função que se chama com o novo valor. Ela não cria a caixinha e não serve só para ler.",
          flash: {
            titulo: "setTaskName",
            texto: "É a única função autorizada a alterar o valor. Toda chamada agenda e executa uma nova renderização do componente, que reaparece na tela com o valor novo.",
            codigo: `setTaskName('Comprar pão');`
          }
        },
        {
          id: "state",
          tipo: "certa",
          rotulo: "Cria a caixinha",
          codigo: "useState('')",
          maq: "caixa-memoria",
          faz: "cria a caixinha de memória e começa vazia",
          resumo: "Cria a caixinha de memória com valor inicial vazio.",
          dica: "Pense no que precisa existir antes de qualquer texto ser guardado: um lugar, que já nasce com um valor inicial.",
          dicaForte: "O valor inicial é uma string vazia, porque o campo começa vazio. Procure a peça que cria e guarda o valor.",
          pistaErro: "Lembrete: `useState('')` só cria a caixinha e define o valor inicial. Quem lê e quem troca o valor são outras peças.",
          flash: {
            titulo: "useState('')",
            texto: "Cria a caixinha de memória do componente. O valor inicial é uma string vazia, porque o campo começa vazio. O React acompanha essa caixinha e refaz a tela quando ela muda.",
            codigo: `const [taskName, setTaskName] = useState('');`
          }
        },
        {
          id: "nome",
          tipo: "certa",
          rotulo: "Valor atual",
          codigo: "taskName",
          maq: "janela-leitura",
          faz: "entrega o texto que está guardado agora",
          resumo: "Entrega o texto que está guardado agora.",
          dica: "É o primeiro nome do par entre colchetes. Quando você o lê, o que vem?",
          dicaForte: "Ele só serve para ler: mostra o texto que está sendo digitado naquele momento. Procure a peça que entrega o valor guardado.",
          pistaErro: "Lembrete: `taskName` é só o valor que está guardado. Ele não troca nada sozinho.",
          flash: {
            titulo: "taskName",
            texto: "É o valor atual da caixinha, o texto que está sendo digitado naquele momento. Como o valor inicial é uma string, o TypeScript infere sozinho que `taskName` é do tipo string.",
            codigo: `const [taskName, setTaskName] = useState('');`
          }
        },
        {
          id: "let",
          tipo: "armadilha",
          rotulo: "Variável comum",
          codigo: "let taskName = ''",
          maq: "caixa-sem-fundo",
          faz: "muda por dentro, mas a tela continua igual",
          resumo: "Muda por dentro, mas a tela continua igual.",
          pistaErro: "Lembrete: o React só refaz a tela quando uma caixinha de estado é atualizada pela função correta.",
          falhaPropria: {
            titulo: "A caixa sem fundo",
            texto: "Uma variável comum é esquecida a cada renderização e o React não é avisado quando ela muda. O texto some pelo fundo da caixa e a tela continua igual. Nos testes, o campo ficou travado em vazio."
          },
          flash: {
            titulo: "Variável comum",
            texto: "Dentro de um componente funcional, uma variável comum é esquecida a cada renderização e, mesmo que seja alterada, a tela não se atualiza. Nos testes, o campo ficou travado em vazio.",
            codigo: `let taskName = '';\ntaskName = 'Comprar pão'; // a tela não vê`
          }
        }
      ],
      pacotes: [
        { id: "p1", evento: "digitar", texto: "Comprar pão", rotulo: "Digitar “Comprar pão”" },
        { id: "p2", evento: "digitar", texto: "Estudar", rotulo: "Digitar “Estudar”" }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "fios",
      nome: "Os dois fios do campo",
      cor: "#0c8f8f",
      pedido:
        "O campo precisa mostrar o que a pessoa digita. Cada tecla deve ir para o estado, o estado deve voltar ao campo e o campo vazio precisa de um texto de orientação.",
      origem: { rotulo: "Teclado", maq: "teclado" },
      destino: { rotulo: "Campo do celular", maq: "campo" },
      mostrarEspacos: false,
      celular0: { texto: "", refeitas: 0 },
      slots: [
        {
          id: "A",
          papel: "Escuta as teclas e manda cada uma ao estado",
          curto: "Escrita",
          certo: "escrita",
          ok: { padrao: "Cada tecla do campo chega ao estado: `{t}` foi guardado." },
          pula: { limpar: "Ninguém digitou: o fio de escrita fica parado." },
          falha: {
            titulo: "Campo travado",
            texto: "Sem o fio de escrita, nenhuma tecla chega ao estado. O campo mostra sempre o estado, que nunca muda: digitar não mostra nada e o campo fica travado.",
            celular: { travado: true }
          }
        },
        {
          id: "B",
          papel: "Mostra no campo o que está guardado",
          curto: "Leitura",
          certo: "leitura",
          ok: {
            digitar: "O estado volta para o campo: ele mostra `{t}`.",
            limpar: "O estado está vazio, então o campo fica vazio."
          }
        },
        {
          id: "C",
          papel: "Texto cinza de exemplo com o campo vazio",
          curto: "Exemplo",
          certo: "exemplo",
          ok: {
            digitar: "Com texto no campo, o texto cinza de exemplo some.",
            limpar: "Campo vazio: o texto cinza de exemplo aparece."
          }
        }
      ],
      pecas: [
        {
          id: "escrita",
          tipo: "certa",
          rotulo: "Fio de escrita",
          codigo: "onChangeText={setTaskName}",
          maq: "fio-escrita",
          faz: "leva cada tecla digitada para o estado",
          resumo: "Cada tecla digitada vai parar no estado.",
          dica: "Uma das propriedades escuta o campo. O TextInput já entrega o novo texto como único parâmetro.",
          dicaForte: "Esse fio vai do campo para o estado, a cada tecla digitada, apagada ou colada. Procure a peça que escuta as teclas.",
          pistaErro: "Lembrete: `onChangeText` leva o texto do campo para o estado. Quem mostra o estado no campo é outra propriedade.",
          flash: {
            titulo: "onChangeText",
            texto: "Toda tecla digitada, apagada ou colada atualiza o estado. O TextInput entrega o novo texto como único parâmetro e `setTaskName` espera exatamente um parâmetro, então não precisa de função no meio.",
            codigo: `onChangeText={setTaskName}`
          }
        },
        {
          id: "leitura",
          tipo: "certa",
          rotulo: "Fio de leitura",
          codigo: "value={taskName}",
          maq: "fio-leitura",
          faz: "mostra no campo o que está guardado",
          resumo: "O campo sempre mostra o que está guardado.",
          dica: "Uma das duas propriedades que fazem o React, e não o campo do sistema, ser a fonte da verdade sobre o que aparece.",
          dicaForte: "Esse fio vai do estado para o campo. Procure a peça que faz o campo mostrar sempre o que está guardado.",
          pistaErro: "Lembrete: `value` manda o conteúdo do estado para o campo. Ele não escuta teclas.",
          flash: {
            titulo: "value",
            texto: "O campo sempre exibe exatamente o que está guardado no estado. É isso que torna o componente controlado: o React, e não o campo de texto do sistema, é a fonte da verdade. Com `value` e sem `onChangeText`, o campo trava.",
            codigo: `<TextInput\n  value={taskName}\n  onChangeText={setTaskName}\n/>`
          }
        },
        {
          id: "exemplo",
          tipo: "certa",
          rotulo: "Texto de exemplo",
          codigo: `placeholder=\n"Digite o nome da tarefa..."`,
          maq: "placa-cinza",
          faz: "mostra um texto cinza de orientação enquanto o campo está vazio",
          resumo: "Texto cinza de exemplo enquanto o campo está vazio.",
          dica: "Não tem nada a ver com controlar o valor. É só uma orientação visual para quem vai digitar.",
          dicaForte: "Ele só aparece enquanto o campo está vazio. Procure a peça do texto cinza.",
          pistaErro: "Lembrete: `placeholder` só orienta quem vai digitar. Ele não liga o campo ao estado.",
          flash: {
            titulo: "placeholder",
            texto: "É o texto de exemplo mostrado enquanto o campo está vazio. Junto com `placeholderTextColor` e `style`, é só estilização: não tem relação com o controle do valor do campo.",
            codigo: `placeholder="Digite o nome da tarefa..."\nplaceholderTextColor={colors.lightText}`
          }
        },
        {
          id: "default",
          tipo: "armadilha",
          rotulo: "Valor só no começo",
          codigo: "defaultValue={taskName}",
          maq: "etiqueta-inicial",
          faz: "só dá o valor inicial: o campo deixa de ser controlado",
          resumo: "Aceita digitar, mas o texto não é limpo depois.",
          pistaErro: "Lembrete: `defaultValue` só entrega o valor na primeira vez. Depois, o campo passa a se virar sozinho.",
          falhaPropria: {
            titulo: "Campo solto",
            texto: "Com `defaultValue` no lugar de `value`, o campo deixa de ser controlado. Digitar funciona, mas `setTaskName('')` não esvazia a tela. Nos testes, “abc” continuou no campo depois do toque."
          },
          flash: {
            titulo: "defaultValue",
            texto: "Só entrega o valor inicial do campo. Depois disso o campo vive por conta própria: digitar funciona, mas mudar o estado não muda o campo. Por isso `setTaskName('')` não limpa a tela.",
            codigo: `<TextInput defaultValue={taskName} />\n// digita, mas não limpa`
          }
        }
      ],
      pacotes: [
        { id: "p1", evento: "digitar", texto: "Comprar pão", rotulo: "Digitar “Comprar pão”" },
        { id: "p2", evento: "limpar", texto: "", rotulo: "Estado volta a vazio" }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "botao",
      nome: "O botão que escuta o toque",
      cor: "#7048e8",
      pedido:
        "A função `handleAddTask` deve rodar só quando o dedo toca no botão, nunca ao abrir a tela, e o botão precisa esmaecer enquanto é apertado.",
      origem: { rotulo: "Dedo", maq: "dedo" },
      destino: { rotulo: "Botão do celular", maq: "botao" },
      mostrarEspacos: false,
      celular0: { texto: "", refeitas: 0 },
      slots: [
        {
          id: "A",
          papel: "Torna a área tocável e esmaece ao apertar",
          curto: "Área",
          certo: "touchable",
          ok: {
            abrir: "A área tocável fica parada, esperando o dedo.",
            tocar: "A área recebe o toque e esmaece por um instante."
          }
        },
        {
          id: "B",
          papel: "Entrega a função ao React, para rodar só no toque",
          curto: "Gatilho",
          certo: "ref",
          ok: {
            abrir: "O React guarda `handleAddTask` e espera. Nada roda ao abrir a tela.",
            tocar: "O toque chega e o React chama `handleAddTask`."
          }
        }
      ],
      pecas: [
        {
          id: "touchable",
          tipo: "certa",
          rotulo: "Área tocável",
          codigo: "<TouchableOpacity>",
          maq: "area-tocavel",
          faz: "deixa o botão tocável e esmaece ao apertar",
          resumo: "Deixa o botão tocável e esmaece ao apertar.",
          dica: "Ele envolve o conteúdo visual para torná-lo tocável, já que o React Native não tem um botão nativo tão simples de estilizar.",
          dicaForte: "Além de tocável, ele dá um retorno visual no instante do toque. Procure a peça que esmaece o botão.",
          pistaErro: "Lembrete: `TouchableOpacity` envolve o conteúdo e mostra um retorno visual ao toque. Quem dispara a função é o `onPress`.",
          flash: {
            titulo: "TouchableOpacity",
            texto: "Torna qualquer conteúdo dentro dele tocável (um texto, um ícone, uma View) e dá um feedback visual de opacidade reduzida no instante em que o dedo toca a área.",
            codigo: `<TouchableOpacity\n  style={[styles.button, styles.buttonPrimary]}\n  onPress={handleAddTask}\n>\n  <Text>+ Adicionar Tarefa</Text>\n</TouchableOpacity>`
          }
        },
        {
          id: "ref",
          tipo: "certa",
          rotulo: "Passa a função",
          codigo: "onPress={handleAddTask}",
          maq: "gatilho",
          faz: "entrega a função ao React, que a executa no toque",
          resumo: "A função roda só quando o dedo toca no botão.",
          dica: "Repare que a função é entregue, sem nada depois do nome. O React guarda e usa quando for a hora.",
          dicaForte: "O React chama a função por conta própria, no toque. Procure a peça que só dispara quando o dedo toca.",
          pistaErro: "Lembrete: `onPress={handleAddTask}` entrega a função ao React, que a executa no toque.",
          flash: {
            titulo: "onPress={handleAddTask}",
            texto: "Conecta o toque à lógica do componente: sempre que a pessoa toca dentro da área do botão, a função `handleAddTask` é executada. A função é passada, não chamada.",
            codigo: `<TouchableOpacity\n  onPress={handleAddTask}\n>`
          }
        },
        {
          id: "pressable",
          tipo: "alternativa",
          rotulo: "Alternativa mais nova",
          codigo: "<Pressable>",
          maq: "area-pressable",
          faz: "recebe o toque, mas o efeito de apertar é por sua conta",
          resumo: "Recebe o toque, mas o efeito de apertar é por sua conta.",
          pistaErro: "Lembrete: `Pressable` também recebe o toque, mas a aparência de apertado precisa ser programada.",
          falhaPropria: {
            titulo: "Pressable sem estilo",
            texto: "O `Pressable` recebeu o toque e a função rodou, mas o botão não mudou de aparência: sem `style={({ pressed }) => ...}`, nada esmaece. O pedido exige o retorno visual, e ele veio pronto no `TouchableOpacity`."
          },
          flash: {
            titulo: "Pressable",
            texto: "Dispara o toque igual ao `TouchableOpacity`. Sem efeito visual, a menos que você programe `style={({ pressed }) => ...}`. Nos testes, o campo foi limpo do mesmo jeito que com o `TouchableOpacity`.",
            codigo: `<Pressable\n  onPress={handleAddTask}\n  style={({ pressed }) => ({\n    opacity: pressed ? 0.6 : 1\n  })}\n>`
          }
        },
        {
          id: "call",
          tipo: "armadilha",
          rotulo: "Chama na hora",
          codigo: "onPress={handleAddTask()}",
          maq: "gatilho-chamado",
          faz: "chama a função ao montar a tela, e o botão recebe só o retorno",
          resumo: "Dispara ao abrir a tela e o toque não faz nada.",
          pistaErro: "Lembrete: parênteses depois do nome significam executar agora, e não esperar o toque.",
          falhaPropria: {
            titulo: "O gatilho que dispara sozinho",
            texto: "Com parênteses, a função roda durante a montagem da tela e o botão recebe o retorno dela (`undefined`). O alerta de erro apareceu ao abrir a tela, sem ninguém tocar, e o toque depois não fez nada. O TypeScript também recusa essa linha."
          },
          flash: {
            titulo: "onPress={handleAddTask()}",
            texto: "Com parênteses, a função roda durante a montagem da tela e o botão recebe o retorno dela (`undefined`). Nos testes, o alerta de erro apareceu ao abrir a tela e o toque não fez nada. O TypeScript também recusa essa linha.",
            codigo: `onPress={handleAddTask()}\n// roda ao abrir a tela`
          }
        }
      ],
      pacotes: [
        { id: "p1", evento: "abrir", texto: "", rotulo: "Abrir a tela" },
        { id: "p2", evento: "tocar", texto: "Comprar pão", rotulo: "Tocar com “Comprar pão”" }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "alertas",
      nome: "Os alertas na tela",
      cor: "#d6336c",
      pedido:
        "Tocar com o campo vazio deve mostrar um aviso de erro. Tocar com texto deve mostrar o texto de volta. A pessoa fecha a caixa no botão OK. Tem que funcionar no celular.",
      origem: { rotulo: "Toque", maq: "dedo" },
      destino: { rotulo: "Tela do celular", maq: "celular-mini" },
      mostrarEspacos: false,
      celular0: { texto: "", refeitas: 0 },
      slots: [
        {
          id: "A",
          papel: "Aviso de erro quando o campo está vazio",
          curto: "Erro",
          certo: "erro",
          ok: { padrao: "Campo vazio: `Alert.alert('Erro', ...)` mostra o aviso." },
          pula: { padrao: "Tem texto: o aviso de erro fica parado." }
        },
        {
          id: "B",
          papel: "Confirmação que mostra o texto digitado",
          curto: "Confirma",
          certo: "ok",
          ok: { padrao: "Tem texto: `Alert.alert('Tarefa digitada', trimmedName)` mostra `{t}` de volta." },
          pula: { padrao: "Sem texto, a confirmação fica parada." }
        },
        {
          id: "C",
          papel: "Botões da caixa: o sistema coloca o OK sozinho",
          curto: "Botões",
          certo: "botoes",
          ok: { padrao: "Sem lista de botões, o sistema coloca o botão OK sozinho." }
        }
      ],
      pecas: [
        {
          id: "erro",
          tipo: "certa",
          rotulo: "Alerta de erro",
          codigo: `Alert.alert('Erro',\n  'Por favor, digite...')`,
          maq: "megafone-erro",
          faz: "avisa que falta o nome quando o campo está vazio",
          resumo: "Avisa que falta o nome quando o campo está vazio.",
          dica: "Título fixo e uma mensagem que explica o que precisa ser corrigido. Quando a pessoa chega nesse alerta?",
          dicaForte: "Só quando ela tenta adicionar uma tarefa sem escrever nada. Procure a peça que avisa que falta o nome.",
          pistaErro: "Lembrete: o alerta de título `'Erro'` é o aviso para o caso de tarefa vazia.",
          flash: {
            titulo: "Alert.alert de erro",
            texto: "Título fixo “Erro” e uma mensagem que explica o que precisa ser corrigido. É mostrado quando a pessoa tenta adicionar uma tarefa vazia. No celular, usa a caixa de diálogo nativa do sistema.",
            codigo: `Alert.alert(\n  'Erro',\n  'Por favor, digite um nome para a tarefa'\n);`
          }
        },
        {
          id: "ok",
          tipo: "certa",
          rotulo: "Alerta de confirmação",
          codigo: `Alert.alert(\n  'Tarefa digitada', trimmedName)`,
          maq: "megafone-ok",
          faz: "mostra de volta o texto que a pessoa digitou",
          resumo: "Mostra de volta o texto que a pessoa digitou.",
          dica: "Título fixo e, como mensagem, entra uma variável. De onde vem o conteúdo exibido?",
          dicaForte: "Por enquanto o app só simula que a tarefa foi adicionada, mostrando o texto de volta. Procure a peça que devolve o texto.",
          pistaErro: "Lembrete: o alerta de título `'Tarefa digitada'` devolve para a pessoa o texto que ela escreveu.",
          flash: {
            titulo: "Alert.alert de confirmação",
            texto: "Título fixo “Tarefa digitada” e, como mensagem, o próprio conteúdo digitado pela pessoa. É um comportamento temporário: por enquanto o app apenas simula que a tarefa foi adicionada.",
            codigo: `Alert.alert('Tarefa digitada', trimmedName);`
          }
        },
        {
          id: "botoes",
          tipo: "certa",
          rotulo: "Sem lista de botões",
          codigo: `Alert.alert(title, message)\n// sem terceiro argumento`,
          maq: "botao-ok",
          faz: "deixa o sistema colocar sozinho um botão OK",
          resumo: "O sistema coloca sozinho um botão OK.",
          dica: "Os dois alertas do app foram chamados só com título e mensagem. E os botões? Quem decide?",
          dicaForte: "Sem a lista de botões, o sistema se encarrega. Procure a peça do botão que aparece sozinho.",
          pistaErro: "Lembrete: sem o terceiro argumento, a lista de botões fica por conta do sistema.",
          flash: {
            titulo: "Alert.alert sem botões",
            texto: "Quando você não passa a lista de botões, o sistema coloca um botão OK. O `Alert.alert` não faz parte do JSX: é uma chamada de função que abre a caixa de diálogo do sistema.",
            codigo: `Alert.alert(title, message?, buttons?, options?)`
          }
        },
        {
          id: "web",
          tipo: "armadilha",
          rotulo: "Versão web",
          codigo: `Alert.alert(...)\n// react-native-web`,
          maq: "megafone-mudo",
          faz: "na versão web é uma função vazia: nenhuma caixa aparece",
          resumo: "Na versão web, nenhuma caixa aparece.",
          pistaErro: "Lembrete: o comportamento de `Alert.alert` muda conforme a plataforma em que o app roda.",
          falhaPropria: {
            titulo: "O megafone mudo",
            texto: "No `react-native-web`, `Alert.alert` é uma função vazia: nenhuma caixa aparece, nem mesmo a do navegador. Esta peça deixou o pacote passar em silêncio, e o pedido exige a caixa no celular."
          },
          flash: {
            titulo: "Alert.alert na web",
            texto: "No react-native-web, `Alert.alert` é uma função vazia: nenhuma caixa aparece, nem mesmo a do navegador. Quem testa só na versão web não vê alerta algum. Teste também no celular ou no emulador.",
            codigo: `static alert() {}\n// react-native-web`
          }
        }
      ],
      pacotes: [
        { id: "p1", evento: "tocar", texto: "", rotulo: "Tocar com o campo vazio" },
        { id: "p2", evento: "tocar", texto: "Comprar pão", rotulo: "Tocar com “Comprar pão”" },
        { id: "p3", evento: "web", texto: "Comprar pão", rotulo: "Teste no navegador", observar: true }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "porteiro",
      nome: "O porteiro da validação",
      cor: "#2b8a3e",
      pedido:
        "Antes de aceitar uma tarefa, o porteiro confere o texto. Texto válido: confirma e limpa o campo. Texto só com espaços: avisa o erro e não limpa o campo. Os espaços das pontas não contam, mas o do meio fica.",
      origem: { rotulo: "Texto digitado", maq: "teclado" },
      destino: { rotulo: "Tela do celular", maq: "celular-mini" },
      mostrarEspacos: true,
      celular0: { texto: "", refeitas: 0 },
      slots: [
        {
          id: "A",
          papel: "Corta os espaços das pontas do texto",
          curto: "Corta",
          certo: "trim",
          ok: { padrao: "O texto chega como `{t}` e sai sem os espaços das pontas." }
        },
        {
          id: "B",
          papel: "Pergunta se sobrou texto",
          curto: "Pergunta",
          certo: "if",
          ok: { padrao: "A cancela pergunta: sobrou algum texto?" }
        },
        {
          id: "C",
          papel: "Se não sobrou nada: avisa o erro e interrompe",
          curto: "Se vazio",
          certo: "erroRet",
          ok: { padrao: "Nada sobrou: o erro é avisado e o `return` interrompe a função." }
        },
        {
          id: "D",
          papel: "Se sobrou texto: confirma e limpa o campo",
          curto: "Se tem texto",
          certo: "okClear",
          ok: { padrao: "Sobrou texto: a confirmação mostra o texto e o campo é limpo." }
        }
      ],
      pecas: [
        {
          id: "trim",
          tipo: "certa",
          rotulo: "Corta as pontas",
          codigo: `const trimmedName =\n  taskName.trim();`,
          maq: "tesoura",
          faz: "tira os espaços do começo e do fim do texto",
          resumo: "Tira os espaços do começo e do fim do texto.",
          dica: "Sem isso, um texto só com espaços passaria pela validação. Ele mexe em qual parte do texto?",
          dicaForte: "Só nas pontas, no começo e no fim. Procure a peça que tira espaços das pontas.",
          pistaErro: "Lembrete: `trim()` só limpa o começo e o fim do texto. Ele não decide sozinho se algo é erro.",
          flash: {
            titulo: "taskName.trim()",
            texto: "Remove os espaços do início e do fim e guarda o resultado em `trimmedName`. Sem isso, um texto só com espaços passaria pela validação. Nos testes, espaços, tabs, quebras de linha e espaço sem quebra foram removidos; o espaço de largura zero (U+200B) não.",
            codigo: `const trimmedName = taskName.trim();`
          }
        },
        {
          id: "if",
          tipo: "certa",
          rotulo: "Pergunta se ficou vazio",
          codigo: `if (!trimmedName) {\n  ...\n}`,
          maq: "cancela-pergunta",
          faz: "pergunta se o texto ficou vazio",
          resumo: "Texto vazio conta como falso e cai no erro.",
          dica: "Em JavaScript e TypeScript, um tipo específico de texto é tratado como valor falso. Qual?",
          dicaForte: "A string vazia vale como falso, e o ponto de exclamação inverte. Procure a peça que faz a pergunta.",
          pistaErro: "Lembrete: `if (!trimmedName)` só faz a pergunta. Cortar espaços e interromper a função são outras peças.",
          flash: {
            titulo: "if (!trimmedName)",
            texto: "Verifica se a string ficou vazia depois do `trim()`. Uma string vazia é tratada como valor falso em JavaScript e TypeScript; o `!` inverte, então o bloco roda quando não sobrou nada.",
            codigo: `if (!trimmedName) {\n  Alert.alert('Erro', '...');\n  return;\n}`
          }
        },
        {
          id: "erroRet",
          tipo: "certa",
          rotulo: "Cláusula de guarda",
          codigo: `Alert.alert('Erro', '...');\nreturn;`,
          maq: "placa-pare",
          faz: "avisa o erro e interrompe a função",
          resumo: "Interrompe a função e nada abaixo roda.",
          dica: "Depois de avisar o erro, o que impede o código de seguir em frente até o alerta de confirmação?",
          dicaForte: "Ele encerra a função ali mesmo. Procure a peça que avisa o erro e barra o caminho.",
          pistaErro: "Lembrete: `return` encerra a função naquele ponto. Ele não faz pergunta nem corta texto.",
          flash: {
            titulo: "return (cláusula de guarda)",
            texto: "Interrompe a função ali mesmo quando a validação falha. Sem o `return`, o alerta de erro apareceria e o código continuaria para o alerta de confirmação e para a limpeza do campo.",
            codigo: `if (!trimmedName) {\n  Alert.alert('Erro', '...');\n  return;\n}`
          }
        },
        {
          id: "okClear",
          tipo: "certa",
          rotulo: "Esvazia o campo",
          codigo: `Alert.alert(...);\nsetTaskName('');`,
          maq: "carimbo-borracha",
          faz: "mostra a confirmação e esvazia o campo",
          resumo: "Deixa o campo limpo para a próxima tarefa.",
          dica: "Só roda quando a validação passou. Prepara o campo para a tarefa seguinte, usando a porta oficial do estado.",
          dicaForte: "Troca o valor guardado por uma string vazia, e como o campo é controlado, ele esvazia. Procure a peça que confirma e deixa o campo limpo.",
          pistaErro: "Lembrete: `setTaskName('')` só esvazia o estado e, por consequência, o campo. A pergunta de validação vem antes.",
          flash: {
            titulo: "setTaskName('')",
            texto: "Depois do alerta de confirmação, o estado volta a ser vazio e, como o campo é controlado, ele fica limpo para a próxima tarefa. Com só espaços, o erro aparece e o campo não é limpo, porque o `return` vem antes. O `Alert.alert` não bloqueia: o campo já está limpo quando a caixa aparece.",
            codigo: `Alert.alert('Tarefa digitada', trimmedName);\nsetTaskName('');`
          }
        },
        {
          id: "replace",
          tipo: "armadilha",
          rotulo: "Tira todo espaço",
          codigo: `const trimmedName = taskName.replace(\n  /\\s/g, '');`,
          maq: "trituradora",
          faz: "remove os espaços do começo, do fim e também do meio",
          resumo: "Remove os espaços do começo, do fim e do meio.",
          pistaErro: "Lembrete: `trim()` só mexe nas pontas. Esta peça mexe no texto inteiro.",
          falhaPropria: {
            titulo: "A trituradora de espaços",
            texto: "Esta peça tira também o espaço do meio: “Comprar pão” virou “Comprarpão”. O `trim()` só mexe nas pontas, e é isso que o pedido quer. E ele não remove tudo que é invisível: nos testes, o espaço de largura zero (U+200B) passou pela validação."
          },
          flash: {
            titulo: "trim() só corta as pontas",
            texto: "O `trim()` só mexe nas pontas. Em “Comprar pão”, o espaço do meio continua lá. Remover todos os espaços exigiria outra técnica e estragaria o nome da tarefa. E ele não remove tudo que é invisível: o espaço de largura zero (U+200B) passa pela validação.",
            codigo: `'  Comprar pão  '.trim();\n// 'Comprar pão'`
          }
        }
      ],
      pacotes: [
        { id: "p1", evento: "tocar", texto: "Comprar pão", rotulo: "Tocar com “Comprar pão”" },
        { id: "p2", evento: "tocar", texto: "   ", rotulo: "Tocar com só espaços" },
        { id: "p3", evento: "tocar", texto: "  Estudar  ", rotulo: "Tocar com “  Estudar  ”" }
      ]
    },

    /* ------------------------------------------------------------------ */
    {
      id: "montagem",
      nome: "A montagem dos dois arquivos",
      cor: "#1971c2",
      pedido:
        "O componente nasce em `TaskInput.tsx` e precisa aparecer na `HomeScreen.tsx`. Ele não deve aceitar props de fora. O caminhão leva o componente de um arquivo ao outro.",
      origem: { rotulo: "Componente", maq: "componente" },
      destino: { rotulo: "Tela do celular", maq: "celular-mini" },
      mostrarEspacos: false,
      grupos: ["TaskInput.tsx", "HomeScreen.tsx"],
      celular0: { texto: "", refeitas: 0, conteudo: "vazio" },
      slots: [
        {
          id: "A",
          grupo: 0,
          papel: "Tipo do componente: não recebe props de fora",
          curto: "Tipo",
          certo: "fc",
          ok: {
            montar: "O componente nasce com o tipo `React.FC`, sem props declaradas.",
            props: "Sem props declaradas, o TypeScript recusa `nome=\"x\"`: erro de tipo, como esperado."
          }
        },
        {
          id: "B",
          grupo: 0,
          papel: "Porta de saída: deixa o componente disponível",
          curto: "Saída",
          certo: "export",
          ok: { padrao: "A porta de saída abre: o componente pode sair do arquivo." },
          pula: { props: "O erro de tipo acontece antes: o caminhão nem sai." }
        },
        {
          id: "C",
          grupo: 1,
          papel: "Porta de entrada: traz o componente pronto",
          curto: "Entrada",
          certo: "import",
          ok: { padrao: "O caminhão sobe uma pasta, entra em `components` e o `import` encontra o componente." },
          pula: { props: "O erro de tipo acontece antes: o caminhão nem chega." }
        },
        {
          id: "D",
          grupo: 1,
          papel: "Uso na tela: coloca o campo e o botão",
          curto: "Uso",
          certo: "jsx",
          ok: { padrao: "`<TaskInput />` coloca o campo e o botão na tela da `HomeScreen`." },
          pula: { props: "O erro de tipo acontece antes: nada chega à tela." }
        }
      ],
      pecas: [
        {
          id: "fc",
          tipo: "certa",
          rotulo: "Tipo do componente",
          codigo: `export const TaskInput:\n  React.FC = () => {`,
          maq: "etiqueta-fc",
          faz: "avisa que o componente não recebe props de fora",
          resumo: "Avisa que o componente não recebe props de fora.",
          dica: "É a anotação de tipo do componente. Escrita assim, sem nada entre colchetes, o que ela diz sobre o que chega de fora?",
          dicaForte: "Sem props declaradas, passar qualquer uma gera erro no TypeScript. Procure a peça que diz que nada chega de fora.",
          pistaErro: "Lembrete: `React.FC` descreve o tipo do componente e do que ele aceita receber. Ele não exporta nem importa.",
          flash: {
            titulo: "React.FC",
            texto: "Declara o componente sem props entre colchetes: ele não espera receber nada de fora. Nos testes, passar `<TaskInput nome=\"x\" />` gerou erro de tipo.",
            codigo: `export const TaskInput: React.FC = () => {`
          }
        },
        {
          id: "export",
          tipo: "certa",
          rotulo: "Porta de saída",
          codigo: "export const TaskInput",
          maq: "porta-saida",
          faz: "deixa o componente disponível para outros arquivos",
          resumo: "Deixa o componente disponível para outros arquivos.",
          dica: "Sem isso, o componente existe só dentro do próprio arquivo. Falta algo para os outros enxergarem.",
          dicaForte: "É o lado que oferece, em `TaskInput.tsx`. Procure a peça que deixa o componente disponível para outros arquivos.",
          pistaErro: "Lembrete: `export` abre a porta do arquivo que oferece. Quem usa o componente é outro arquivo.",
          flash: {
            titulo: "export const TaskInput",
            texto: "Declara o componente e o deixa disponível para outros arquivos. É uma exportação nomeada, então quem importa precisa usar chaves.",
            codigo: `export const TaskInput: React.FC = () => {\n  ...\n};`
          }
        },
        {
          id: "import",
          tipo: "certa",
          rotulo: "Porta de entrada",
          codigo: `import { TaskInput }\n  from '../components/TaskInput'`,
          maq: "porta-entrada",
          faz: "sobe uma pasta e traz o componente de components",
          resumo: "Sobe uma pasta e traz o componente de components.",
          dica: "Está na `HomeScreen`. O caminho começa com dois pontos e uma barra: o que isso quer dizer para as pastas?",
          dicaForte: "Subir uma pasta, saindo de `screens`, e entrar em `components`. Procure a peça que traz o componente para a `HomeScreen`.",
          pistaErro: "Lembrete: `import` fica na `HomeScreen` e traz algo que já foi exportado em outro arquivo.",
          flash: {
            titulo: "import { TaskInput }",
            texto: "Traz o componente de `'../components/TaskInput'`: sobe uma pasta, saindo de `screens`, e entra em `components`. As chaves são necessárias porque a exportação é nomeada; sem elas, o TypeScript reclama que não existe export default.",
            codigo: `import { TaskInput } from '../components/TaskInput';`
          }
        },
        {
          id: "jsx",
          tipo: "certa",
          rotulo: "Uso na tela",
          codigo: "<TaskInput />",
          maq: "na-tela",
          faz: "coloca o campo e o botão na tela da HomeScreen",
          resumo: "Coloca o campo e o botão na tela da HomeScreen.",
          dica: "É onde o componente aparece de verdade, no lugar do bloco que só avisava que ali iria o campo.",
          dicaForte: "Aparece sem nenhuma prop, porque ele cuida sozinho do próprio estado. Procure a peça que coloca o componente na tela.",
          pistaErro: "Lembrete: `<TaskInput />` só funciona depois que o componente foi exportado e importado.",
          flash: {
            titulo: "<TaskInput />",
            texto: "Coloca o campo e o botão na tela, sem nenhuma prop: o `TaskInput` funciona isolado e cuida sozinho do seu próprio estado interno.",
            codigo: `<View style={styles.container}>\n  <TaskInput />\n  ...\n</View>`
          }
        },
        {
          id: "default",
          tipo: "armadilha",
          rotulo: "Exportação padrão",
          codigo: "export default TaskInput",
          maq: "porta-padrao",
          faz: "exporta o componente como padrão, e não pelo nome",
          resumo: "Exporta o componente como padrão, e não pelo nome.",
          pistaErro: "Lembrete: uma exportação padrão se importa sem chaves. Uma exportação nomeada se importa com chaves.",
          falhaPropria: {
            titulo: "A porta errada",
            texto: "O arquivo exportou o componente como padrão, mas o `import { TaskInput }` com chaves procura uma exportação nomeada. O TypeScript reclama que o módulo não tem esse membro, e o caminhão chegou sem carga."
          },
          flash: {
            titulo: "Exportação nomeada ou padrão",
            texto: "Com `export const TaskInput`, a exportação é nomeada e quem importa usa chaves. Com `export default`, o import não usa chaves. Misturar as duas formas faz o TypeScript reclamar que o módulo não tem o membro procurado.",
            codigo: `export const TaskInput = ...   // import { TaskInput }\nexport default TaskInput       // import TaskInput`
          }
        }
      ],
      pacotes: [
        { id: "p1", evento: "montar", texto: "", rotulo: "Abrir a HomeScreen" },
        { id: "p2", evento: "props", texto: "nome=\"x\"", rotulo: "Passar nome=\"x\"" }
      ]
    }
  ],

  guia: {
    objetivo:
      "Fixar os conceitos do TaskInput montando e ligando uma linha de produção: useState e a caixinha de memória, o campo controlado com value e onChangeText, o botão com onPress, os alertas, a validação com trim, if e return, e a montagem dos dois arquivos com export e import.",
    comoUsar: [
      "Projete a tela e deixe a sala decidir cada encaixe antes de soltar a peça. Uma pessoa controla o mouse.",
      "Use o Passo a passo na projeção: o pacote avança uma máquina por vez e a legenda explica o que acabou de acontecer.",
      "Depois de cada estação, peça que alguém explique por que a peça armadilha falha, sem olhar a tela.",
      "Não há cronômetro. As dicas podem ser limitadas (6 no jogo todo) ou ilimitadas; a escolha é feita na tela inicial.",
      "Uma esteira que falha não tira nada do jogo: só reduz as estrelas da estação, e a janela explica o que o código realmente faz."
    ],
    atencao: [
      "O celular da tela é uma simulação feita no navegador. Ela reproduz o que foi medido na versão web do app (react-native-web). A caixa de alerta real do celular, o teclado virtual e o efeito de opacidade no toque real não foram testados.",
      "Na versão web, `Alert.alert` é uma função vazia e nenhuma caixa aparece. O celular do jogo desenha os alertas por finalidade didática, exceto no teste do navegador da estação 4.",
      "`trim()` remove espaços, tabs, quebras de linha e espaço sem quebra, mas não remove o espaço de largura zero (U+200B): esse caso passa pela validação.",
      "`Alert.alert` não bloqueia a execução: a linha seguinte roda sem esperar o OK. Por isso o campo já está limpo quando o alerta aparece.",
      "Com só espaços, o erro aparece e o campo não é limpo, porque o `return` acontece antes do `setTaskName('')`.",
      "Com `value` e sem `onChangeText`, o campo trava. Com `defaultValue` no lugar de `value`, digitar funciona, mas o campo não é limpo pelo `setTaskName('')`.",
      "`TouchableOpacity` não está marcado como obsoleto na documentação, mas ela recomenda `Pressable` como opção mais completa. O `Pressable` sem estilo recebe o toque, mas não esmaece."
    ],
    perguntas: [
      "O que muda se trocarmos `value` por `defaultValue`? Teste montando a estação 2 com a peça armadilha.",
      "Por que `onPress={handleAddTask()}` mostra o alerta de erro assim que a tela abre?",
      "Se retirarmos o `return` do porteiro, o que a pessoa vê quando toca com o campo vazio?",
      "Por que o texto “Comprar pão” continua com o espaço do meio depois do `trim()`?"
    ]
  }
};
