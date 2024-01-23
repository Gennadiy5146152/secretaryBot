const fetch = require("node-fetch");
const { Telegraf } = require("telegraf");

const chatId = "-1002078171202";

const bot = new Telegraf("6896936323:AAGouDNPnTD3ssJ5XJcqjSkLa5fqfS_EV2s", {
  handlerTimeout: 9_000_000,
});

let performers = [
  { name: "@KorotkovAlex", id: "fd44221b-b6d0-4fdc-a9de-bd28d31e5a01" },
  { name: "@Mandarkz", id: "8408043e-44a9-4810-9f5f-8c4e9b6f7a3e" },
  { name: "@PavelAlyakrinskiy", id: "b35737d0-0a68-4156-a8f0-6f7a6740305f" },
  { name: "@ideamen51", id: "f9767e82-090d-4cd8-89b7-4c10425a63f6" },
  { name: "@PrKennee", id: "157ee21c-091a-45f9-b4a8-11e77ae10a99" },
  { name: "@Mr_Jaster", id: "32110658-3010-4d37-bf5d-2c640f64f204" },
];

let collumns = [
  { column: "Кор", id: "a70f6f21-d16f-4005-9d99-c23538cf6bf7" },
  { column: "Асг", id: "5307997d-78be-4cd9-a078-6b97b6e07b07" },
  { column: "Кофе", id: "71eb0176-f2e7-4838-aa89-83747942d1d5" },
];

function iterratingPerformers(name, title, boardName) {
  let collumn;
  let elementId;
  performers.forEach((element) => {
    if (element.name == name) {
      elementId = element.id;
    }
  });
  collumns.forEach((element) => {
    if (element.column == boardName) {
      collumn = element.id;
    }
  });
  addTask(collumn, elementId, title);
}

function trimAfterDot(str, title) {
  let text = str.replace("/addtask", "").trimStart();
  let titleEdit = str.replace("/addtask", "").trimStart();
  let boardName = str.replace("/addtask", "").trimStart();
  const dotIndex = text.indexOf(".");
  const dotIndex2 = text.indexOf(" ");
  if (dotIndex !== -1) {
    text = text.substring(dotIndex2 + 1, dotIndex);
    titleEdit = titleEdit.substring(dotIndex + 1);
    boardName = boardName.substring(0, dotIndex2);
  }
  iterratingPerformers(text, titleEdit, boardName);
}

bot.on("text", (ctx) => {
  let text = ctx.message.text;
  try {
    bot.telegram.setMyCommands([
      { command: "/addtask", description: "Добавить задачу" },
    ]);
    bot.telegram.setMyCommands([
      { command: "/server", description: "Узнать статус сервера" },
    ]);
    if (text.includes("/addtask")) {
      trimAfterDot(text, text);
    }
    if (
      ctx.message.text === "/server" ||
      ctx.message.text === "/server@Secretary_Korotkovs_bot"
    ) {
      getStatusServer(ctx);
    }
  } catch (err) {
    console.log(err);
  }
});

function addTask(collumn, name, title) {
  console.log(collumn, name, title);
  fetch("https://ru.yougile.com/api-v2/tasks", {
    method: "POST",
    headers: {
      Authorization:
        "Bearer BHtqt4zRxFA+iLqGdiAuaxBodngaFIelHbEu8jxKAxgByjyzcjazYFsSupsM8AKn",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: title,
      columnId: collumn,
      assigned: [name],
    }),
  })
    .then(async (response) => {
      let result = await response.json();
      let taskId;
      if (response.ok) {
        taskId = fetch(`https://ru.yougile.com/api-v2/tasks/${result.id}`, {
          headers: {
            Authorization:
              "Bearer BHtqt4zRxFA+iLqGdiAuaxBodngaFIelHbEu8jxKAxgByjyzcjazYFsSupsM8AKn",
            "Content-Type": "application/json",
          },
        });
      }
      return taskId;
    })
    .then(async (taskId) => {
      try {
        let result = await taskId.json();
        if (result.id) {
          bot.telegram.sendMessage(chatId, "Задача создана", {
            reply_to_message_id: 6172,
          });
        } else {
          bot.telegram.sendMessage(
            chatId,
            "Ошибка в создании задачи, проверь порядок ввода текста при создании задачи",
            {
              reply_to_message_id: 6172,
            }
          );
        }
      } catch (error) {
        bot.telegram.sendMessage(
          chatId,
          `Ошибка в создании задачи, ${error}. Id колонки:${collumn}, Имя исполнителя:${name} `,
          {
            reply_to_message_id: 6172,
          }
        );
      }
    });
}

const serverConfig = {
  url: "https://korotkovs.com",
  timeout: 5000,
};

async function checkServerStatus() {
  try {
    const response = await fetch(serverConfig.url);
    if (!response.ok) {
      bot.telegram.sendMessage(chatId, `Код ошибки: ${response.status}`, {
        reply_to_message_id: 6172,
      });
      throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Сервер недоступен:", error.message);
    bot.telegram.sendMessage(chatId, `Ошибка ${error.message}`, {
      reply_to_message_id: 6172,
    });
    getStatusServer();
  }
}

async function getStatusServer() {
  try {
    const response = await fetch(serverConfig.url);
    bot.telegram.sendMessage(chatId, `Статус: ${response.status}`, {
      reply_to_message_id: 6172,
    });
  } catch (error) {
    bot.telegram.sendMessage(chatId, "Сервер не работает", {
      reply_to_message_id: 6172,
    });
  }
}

setInterval(checkServerStatus, 60000);

bot.launch();
