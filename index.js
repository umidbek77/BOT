require("dotenv").config();
const { Telegraf } = require("telegraf");
const { google } = require("googleapis");

const bot = new Telegraf(process.env.BOT_TOKEN);
const auth = new google.auth.GoogleAuth({
  keyFile: "google-sheets-key.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

async function savePhoneNumber(userId, phoneNumber) {
  try {
    const spreadsheetId = process.env.SHEET_ID;
    const range = "A:C";
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [[userId, phoneNumber, "Tasdiqlanmagan"]],
      },
    });
    console.log("Telefon raqam saqlandi:", phoneNumber);
  } catch (error) {
    console.error("Xatolik:", error);
  }
}

bot.start((ctx) => {
  ctx.reply('Salom! Iltimos, "📲 Telefon raqamni yuborish" tugmasini bosing.', {
    reply_markup: {
      keyboard: [
        [{ text: "📲 Telefon raqamni yuborish", request_contact: true }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  });
});

bot.on("contact", async (ctx) => {
  const phoneNumber = ctx.message.contact.phone_number;
  const userId = ctx.message.from.id;
  await savePhoneNumber(userId, phoneNumber);
  ctx.reply("✅ Raqamingiz saqlandi. Endi ovoz bering:");
  ctx.reply(
    "🔗 https://openbudget.uz/boards/initiatives/initiative/50/1fe0a54f-b7a5-49d3-bf2d-4b9bf77662c2"
  );
  ctx.reply("✅ Ovoz berganingizdan so‘ng, pastdagi tugmani bosing:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "✅ Tasdiqlash", callback_data: "confirm_vote" }],
      ],
    },
  });
});

bot.action("confirm_vote", async (ctx) => {
  const userId = ctx.from.id;
  const spreadsheetId = process.env.SHEET_ID;
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "A:C",
    });
    let found = false;
    let rowIndex = -1;
    response.data.values.forEach((row, index) => {
      if (row[0] == userId) {
        found = true;
        rowIndex = index + 1;
      }
    });
    if (found) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `C${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: { values: [["Tasdiqlangan"]] },
      });
      ctx.reply("✅ Ovoz berish tasdiqlandi!");
    } else {
      ctx.reply("❌ Ma‘lumot topilmadi. Telefon raqamingizni qayta yuboring.");
    }
  } catch (error) {
    console.error(error);
    ctx.reply("❌ Xatolik yuz berdi. Qayta urinib ko‘ring.");
  }
});

bot.launch();
