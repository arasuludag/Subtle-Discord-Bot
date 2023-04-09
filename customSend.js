const i18next = require("i18next");
const translation = require("./data.json");

// For localization.
i18next.init({
  lng: "en",
  preload: true,
  resources: {
    en: {
      translation,
    },
  },
});

function getEmbed(params) {
  const path = params.path;
  const values = {
    ...params.values,
    returnObjects: true,
    interpolation: { escapeValue: false },
  };
  const title = params.title;
  const content = params.content;
  const components = params.components;
  const ephemeral = params.ephemeral;

  const description = i18next.t(path, values);

  const randomDescription =
    description[Math.floor(Math.random() * description.length)];

  return {
    embeds: [
      {
        color: process.env.EMBEDCOLOR,
        title: title,
        description: randomDescription,
      },
    ],
    content: content,
    components: components,
    ephemeral: ephemeral,
  };
}

module.exports = {
  // Selects a random text from a JSON array.
  replyEmbed: async (to, params) => {
    return await to.reply(getEmbed(params)).catch((error) => {
      console.error("Failed to reply \n" + error);
    });
  },

  sendEmbed: async (to, params) => {
    return await to.send(getEmbed(params)).catch((error) => {
      console.error("Failed to send \n" + error);
    });
  },

  updateEmbed: async (to, params) => {
    return await to.update(getEmbed(params)).catch((error) => {
      console.error("Failed to update \n" + error);
    });
  },

  getEmbed,
};
