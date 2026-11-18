# 🍽️ Cardápio — Sistema de Gerenciamento e Apresentação de Cardápios

> Uma aplicação web desenvolvida com Java e Spring Boot, com o objetivo de oferecer uma solução digital para organização e apresentação de cardápios.

<div align="center">

[![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)](https://www.java.com/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.14-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **[Acessar aplicação](https://cardapio-poli.vercel.app/)**

💻 **[Repositório GitHub](https://github.com/LGA1155dev/cardapio)**

</div>

---

## 📖 Sobre o projeto

O **Cardápio** é um projeto de desenvolvimento de uma aplicação web voltada à digitalização da experiência de consulta e gerenciamento de cardápios.

A proposta é utilizar a tecnologia para tornar a apresentação de produtos e informações de um estabelecimento mais organizada e acessível, substituindo processos que dependem exclusivamente de cardápios físicos ou informações dispersas.

O projeto utiliza Java e Spring Boot na construção do backend, com tecnologias voltadas à renderização de páginas, persistência de dados, validação e segurança.

A arquitetura também conta com uma pasta separada para o frontend, permitindo organizar as responsabilidades da aplicação.

## 🎯 O problema

Em muitos estabelecimentos, a consulta e a atualização de cardápios ainda podem depender de processos manuais.

Isso pode gerar algumas dificuldades:

- 📄 **Dependência de cardápios físicos:** alterações de preços ou produtos podem exigir a impressão de novos materiais.
- 🔄 **Atualizações trabalhosas:** manter as informações atualizadas pode consumir tempo.
- 🔎 **Organização das informações:** produtos, descrições e preços precisam estar apresentados de maneira clara.
- 📱 **Acesso digital:** clientes podem preferir consultar as opções pelo próprio celular.
- ⚙️ **Centralização:** informações do cardápio precisam de uma estrutura organizada para facilitar sua manutenção.

## 💡 Como o projeto propõe resolver isso?

A proposta é construir uma aplicação que utiliza recursos do desenvolvimento web para centralizar a apresentação e o gerenciamento das informações de um cardápio.

Em vez de depender exclusivamente de materiais impressos, a solução utiliza uma aplicação web para disponibilizar as informações digitalmente.

O backend é responsável pela lógica da aplicação, comunicação com a camada de persistência, validação e mecanismos de segurança.

A camada de apresentação permite disponibilizar as informações por meio de uma interface web.

**O objetivo principal é transformar a consulta e a manutenção de um cardápio em uma experiência digital mais organizada.**

---

## 🏗️ Arquitetura e tecnologias

O projeto utiliza uma estrutura baseada no ecossistema Java e Spring.

### ☕ Backend

| Tecnologia | Responsabilidade |
|---|---|
| Java 17 | Linguagem principal do backend |
| Spring Boot 3.5.14 | Estrutura principal da aplicação |
| Spring Web | Recursos para aplicações web e requisições HTTP |
| Spring Data JPA | Persistência e acesso aos dados |
| Hibernate / JPA | Mapeamento objeto-relacional |
| Spring Security | Recursos de autenticação e segurança |
| JWT | Suporte à autenticação baseada em tokens |
| Spring Validation | Validação de dados |
| Lombok | Redução de código repetitivo |
| Gradle | Gerenciamento de dependências e build |

### 🖥️ Apresentação

| Tecnologia | Responsabilidade |
|---|---|
| Thymeleaf | Integração e renderização de páginas HTML no backend |
| HTML | Estruturação das páginas |
| CSS | Estilização das interfaces |
| JavaScript | Recursos e interações no frontend |

O repositório também possui uma pasta `cardapio-front`, destinada à parte de frontend. Consulte essa pasta para identificar suas tecnologias e instruções específicas de execução.

### 🗄️ Banco de dados

O projeto possui dependências para dois bancos de dados:

- **PostgreSQL:** banco relacional para persistência de dados.
- **H2 Database:** banco utilizado como alternativa em ambientes de desenvolvimento e testes.

A utilização de JPA permite trabalhar com entidades Java e abstrair parte das operações de persistência.

---

## 🔐 Segurança

A aplicação inclui dependências voltadas à proteção e ao controle de acesso.

### Spring Security

O Spring Security fornece a infraestrutura para implementar mecanismos de autenticação e autorização.

### JWT

O projeto utiliza a biblioteca JJWT para trabalhar com JSON Web Tokens.

JWT é um formato utilizado para transportar informações de autenticação em tokens assinados.

### Validação

O Spring Boot Validation permite validar informações recebidas pela aplicação, ajudando a evitar dados inválidos antes de seu processamento.

> A presença dessas bibliotecas no projeto indica suporte à implementação desses recursos. As regras efetivamente implementadas devem ser verificadas nas classes de configuração e nos fluxos de autenticação.

---

## 📂 Estrutura do repositório

A organização principal identificada no repositório é:

```text
cardapio/
│
├── cardapio-front/       # Projeto da camada frontend
│
├── src/                  # Código-fonte do backend
│
├── gradle/
│   └── wrapper/          # Arquivos do Gradle Wrapper
│
├── build.gradle          # Dependências e configuração do build
├── settings.gradle       # Configuração do projeto Gradle
├── gradlew               # Gradle Wrapper para Linux/macOS
├── gradlew.bat           # Gradle Wrapper para Windows
│
├── .gitignore
├── .gitattributes
├── LICENSE
└── README.md
```

### Organização interna do backend

O código-fonte está localizado em `src/`. A divisão interna de pacotes e classes deve ser consultada diretamente nessa pasta para acompanhar a implementação atual.

---

## ⚙️ Requisitos para executar

Antes de iniciar, verifique se possui:

| Requisito | Versão |
|---|---|
| Java JDK | 17 ou superior |
| Gradle | Utilizar o Gradle Wrapper incluído |
| PostgreSQL | Caso utilize o banco PostgreSQL |
| Git | Para clonar o repositório |
| Navegador | Para acessar a aplicação |

Você pode verificar sua instalação do Java com:

```bash
java -version
```

---

## 🚀 Como executar o backend

### 1. Clone o repositório

```bash
git clone https://github.com/LGA1155dev/cardapio.git
```

### 2. Entre na pasta

```bash
cd cardapio
```

### 3. Configure o banco de dados

Caso utilize PostgreSQL, crie um banco de dados para a aplicação.

Exemplo:

```sql
CREATE DATABASE cardapio;
```

Em seguida, configure as propriedades de conexão no arquivo de configuração do Spring Boot.

Normalmente, essas configurações ficam em:

```text
src/main/resources/application.properties
```

ou:

```text
src/main/resources/application.yml
```

Exemplo de configuração para PostgreSQL:

```properties
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/cardapio}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

**Importante:** o exemplo é uma configuração ilustrativa. Confira os perfis e as propriedades já existentes no projeto antes de substituir qualquer configuração. Não coloque senhas reais diretamente no GitHub.

### 4. Execute a aplicação

No Linux ou macOS:

```bash
./gradlew bootRun
```

No Windows:

```powershell
.\gradlew.bat bootRun
```

### 5. Acesse a aplicação

Após iniciar o servidor, verifique no terminal a porta configurada pelo Spring Boot.

Caso esteja utilizando a porta padrão:

```text
http://localhost:8080
```

---

## 🧪 Executando os testes

O projeto possui dependências para testes com Spring Boot Test e JUnit Platform.

Para executar os testes:

```bash
./gradlew test
```

No Windows:

```powershell
.\gradlew.bat test
```

Para gerar o relatório de testes, consulte:

```text
build/reports/tests/test/index.html
```

---

## 🧠 Conceitos de desenvolvimento aplicados

O projeto reúne conceitos importantes para o desenvolvimento de aplicações backend com Java.

### ☕ Desenvolvimento com Java

- Programação orientada a objetos.
- Organização de classes e responsabilidades.
- Estruturação de aplicações Java.
- Gerenciamento de dependências.

### 🌱 Spring Boot

- Construção de aplicações web.
- Configuração de dependências.
- Integração com banco de dados.
- Validação de informações.
- Segurança da aplicação.

### 🗄️ Persistência de dados

- Banco de dados relacional.
- Mapeamento objeto-relacional.
- Integração com JPA.
- Utilização de PostgreSQL e H2.

### 🔐 Segurança

- Spring Security.
- Conceitos de autenticação.
- JWT.
- Validação de informações recebidas.

---

## 🔮 Possíveis evoluções

A arquitetura permite pensar em diversas melhorias e funcionalidades futuras:

- 📦 Gerenciamento completo de produtos.
- 🏷️ Organização de produtos por categorias.
- ✏️ Cadastro, edição e exclusão de itens.
- 💰 Atualização de preços.
- 🔎 Pesquisa e filtros de produtos.
- 👤 Gerenciamento de usuários e permissões.
- 📱 Melhorias na experiência mobile.
- 🛒 Sistema de pedidos.
- 📊 Painel administrativo.
- 🧾 Histórico de pedidos.
- 🐳 Containerização com Docker.
- 🚀 Pipeline de integração e entrega contínua.

Essas ideias representam possibilidades de evolução, não necessariamente funcionalidades já implementadas.

---

## 📚 Aprendizados e propósito

Este projeto representa uma oportunidade de aplicar conhecimentos de desenvolvimento web em uma aplicação que possui uma estrutura mais próxima de um sistema real.

Diferentemente de uma página estática, uma aplicação com backend exige pensar em responsabilidades, organização do código, persistência, validação e segurança.

O desenvolvimento também permite aprofundar conhecimentos no ecossistema Spring, especialmente na integração entre Java, banco de dados e tecnologias web.

---

## 👨‍💻 Desenvolvedor

Desenvolvido por **LGA1155dev**.

- GitHub: [@LGA1155dev](https://github.com/LGA1155dev)
- Repositório: [github.com/LGA1155dev/cardapio](https://github.com/LGA1155dev/cardapio)

---

## 📄 Licença

Este projeto está disponibilizado sob a licença MIT.

Consulte o arquivo [`LICENSE`](LICENSE) para conhecer os termos de utilização.

---

<div align="center">

🍽️ **Tecnologia transformando experiências do cotidiano.**

Desenvolvido com ☕ Java e 🌱 Spring Boot.

</div>

<img width="1422" height="747" alt="Screenshot From 2026-11-18 08-42-14" src="https://github.com/user-attachments/assets/007e40b5-14a4-4795-b5bd-8b36539c1810" />

<img width="1422" height="747" alt="Screenshot From 2026-11-18 08-42-28" src="https://github.com/user-attachments/assets/f1b7b570-daf6-4751-83a4-8c2d7d54969f" />

<img width="1422" height="747" alt="Screenshot From 2026-11-18 08-42-34" src="https://github.com/user-attachments/assets/e6b634cc-6a7e-474b-85b7-e035817b8ffd" />

