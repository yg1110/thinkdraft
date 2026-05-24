import { Node, mergeAttributes } from "@tiptap/core";

export const WikiLink = Node.create({
  name: "wikiLink",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      title: {
        default: null,
      },
      exists: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-wiki-link]",
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          return {
            title: element.getAttribute("title") || element.textContent,
            exists: element.getAttribute("data-exists") !== "false",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const exists = HTMLAttributes.exists !== false;
    return [
      "span",
      mergeAttributes(
        {
          "data-wiki-link": "",
          "data-exists": String(exists),
          class: exists ? "wiki-link" : "wiki-link-missing",
        },
        { title: HTMLAttributes.title }
      ),
      HTMLAttributes.title || "",
    ];
  },
});
