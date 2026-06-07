// Function to rebuild context menus based on storage
const rebuildContextMenus = () => {
  chrome.contextMenus.removeAll(() => {
    // Parent menu
    chrome.contextMenus.create({
      id: "insert-profile-parent",
      title: "My Links",
      contexts: ["editable"]
    });

    // Get profiles from chrome.storage.local
    chrome.storage.local.get(null, (items) => {
      const customFields = items.customFields || [
        "Github",
        "Linkedin",
        "Twitter",
        "Portfolio",
        "Email",
        "Dev"
      ];

      let hasItems = false;
      customFields.forEach((field) => {
        const val = items[field];
        if (val && val.trim() !== "") {
          hasItems = true;
          chrome.contextMenus.create({
            id: `profile-${field}`,
            parentId: "insert-profile-parent",
            title: field,
            contexts: ["editable"]
          });
        }
      });

      if (!hasItems) {
        chrome.contextMenus.create({
          id: "no-links-found",
          parentId: "insert-profile-parent",
          title: "No links saved yet",
          enabled: false,
          contexts: ["editable"]
        });
      }
    });
  });
};

// Listeners
chrome.runtime.onInstalled.addListener(rebuildContextMenus);
chrome.runtime.onStartup.addListener(rebuildContextMenus);

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    rebuildContextMenus();
  }
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith("profile-") && tab && tab.id) {
    const fieldName = info.menuItemId.replace("profile-", "");
    
    // Get the link
    chrome.storage.local.get(fieldName, (items) => {
      const linkToInsert = items[fieldName];
      if (linkToInsert && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (textToInsert) => {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable)) {
              if (activeEl.isContentEditable) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  range.deleteContents();
                  range.insertNode(document.createTextNode(textToInsert));
                }
              } else {
                const start = activeEl.selectionStart;
                const end = activeEl.selectionEnd;
                const text = activeEl.value;
                activeEl.value = text.slice(0, start) + textToInsert + text.slice(end);
                activeEl.selectionStart = activeEl.selectionEnd = start + textToInsert.length;
              }
              activeEl.dispatchEvent(new Event('input', { bubbles: true }));
              activeEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
          },
          args: [linkToInsert]
        }).catch(err => console.error("Script execution failed:", err));
      }
    });
  }
});
