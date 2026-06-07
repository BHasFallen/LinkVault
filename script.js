const add_new_button = document.getElementById("add_new_button");
const linksDiv = document.querySelector(".links-area");
const addProfileForm = document.getElementById("add-profile-form");
const newProfileUrlInput = document.getElementById("new-profile-url");
const newProfileIcon = document.getElementById("new-profile-icon");
const confirmAddBtn = document.getElementById("confirm-add-btn");
const cancelAddBtn = document.getElementById("cancel-add-btn");

const autofillBtn = document.getElementById("autofill_btn");
const quickShareBtn = document.getElementById("quick_share_btn");

// Settings Panel Elements
const toggleSettingsBtn = document.getElementById("toggle_settings_btn");
const settingsPanel = document.getElementById("settings-panel");
const settingUsernameInput = document.getElementById("setting-username");
const settingRepoInput = document.getElementById("setting-repo");

// Check environment to prevent errors in non-extension (standalone web page) view
const isExtension = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

// Robust storage helpers with localstorage fallback
const storageGet = (keys, callback) => {
  if (isExtension) {
    chrome.storage.local.get(keys, callback);
  } else {
    if (keys === null) {
      const items = {};
      let customFields = [];
      try {
        customFields = JSON.parse(localStorage.getItem("customFields"));
      } catch (e) {}
      
      if (!customFields) {
        customFields = ["Github", "Linkedin", "Twitter", "Portfolio", "Email", "Dev"];
        localStorage.setItem("customFields", JSON.stringify(customFields));
      }
      
      items.customFields = customFields;
      customFields.forEach(field => {
        items[field] = localStorage.getItem(field) || "";
      });
      // Fallback for settings keys
      items.gitHubUsername = localStorage.getItem("gitHubUsername") || "";
      items.gitHubRepo = localStorage.getItem("gitHubRepo") || "LinkVault";
      
      callback(items);
    } else if (typeof keys === "string") {
      callback({ [keys]: localStorage.getItem(keys) || "" });
    } else {
      const items = {};
      Object.keys(keys).forEach(k => {
        items[k] = localStorage.getItem(k) || keys[k];
      });
      callback(items);
    }
  }
};

const storageSet = (items, callback) => {
  if (isExtension) {
    chrome.storage.local.set(items, callback);
  } else {
    Object.keys(items).forEach(key => {
      if (Array.isArray(items[key]) || typeof items[key] === "object") {
        localStorage.setItem(key, JSON.stringify(items[key]));
      } else {
        localStorage.setItem(key, items[key]);
      }
    });
    if (callback) callback();
  }
};

const storageRemove = (keys, callback) => {
  if (isExtension) {
    chrome.storage.local.remove(keys, callback);
  } else {
    if (Array.isArray(keys)) {
      keys.forEach(k => localStorage.removeItem(k));
    } else {
      localStorage.removeItem(keys);
    }
    if (callback) callback();
  }
};

// Brand matching config for auto-detection
const BRAND_MAPPING = [
  { domain: "github.com", name: "Github", icon: "fa-brands fa-github" },
  { domain: "linkedin.com", name: "Linkedin", icon: "fa-brands fa-linkedin-in" },
  { domain: "twitter.com", name: "Twitter", icon: "fa-brands fa-x-twitter" },
  { domain: "x.com", name: "Twitter", icon: "fa-brands fa-x-twitter" },
  { domain: "instagram.com", name: "Instagram", icon: "fa-brands fa-instagram" },
  { domain: "dev.to", name: "Dev", icon: "fa-brands fa-dev" },
  { domain: "figma.com", name: "Figma", icon: "fa-brands fa-figma" },
  { domain: "dribbble.com", name: "Dribbble", icon: "fa-brands fa-dribbble" },
  { domain: "youtube.com", name: "Youtube", icon: "fa-brands fa-youtube" },
  { domain: "youtu.be", name: "Youtube", icon: "fa-brands fa-youtube" },
  { domain: "facebook.com", name: "Facebook", icon: "fa-brands fa-facebook-f" },
  { domain: "twitch.tv", name: "Twitch", icon: "fa-brands fa-twitch" },
  { domain: "reddit.com", name: "Reddit", icon: "fa-brands fa-reddit-alien" },
  { domain: "medium.com", name: "Medium", icon: "fa-brands fa-medium" },
  { domain: "stackoverflow.com", name: "StackOverflow", icon: "fa-brands fa-stack-overflow" },
  { domain: "gitlab.com", name: "Gitlab", icon: "fa-brands fa-gitlab" },
  { domain: "behance.net", name: "Behance", icon: "fa-brands fa-behance" },
  { domain: "producthunt.com", name: "ProductHunt", icon: "fa-brands fa-product-hunt" },
  { domain: "discord.gg", name: "Discord", icon: "fa-brands fa-discord" },
  { domain: "discord.com", name: "Discord", icon: "fa-brands fa-discord" },
  { domain: "spotify.com", name: "Spotify", icon: "fa-brands fa-spotify" },
  { domain: "slack.com", name: "Slack", icon: "fa-brands fa-slack" },
  { domain: "pinterest.com", name: "Pinterest", icon: "fa-brands fa-pinterest" },
  { domain: "tiktok.com", name: "TikTok", icon: "fa-brands fa-tiktok" }
];

// Helper: Get icon class for URL
const getIconForUrl = (url, defaultName = "") => {
  if (!url || url.trim() === "") {
    if (defaultName) {
      const match = BRAND_MAPPING.find(b => b.name.toLowerCase() === defaultName.toLowerCase());
      if (match) return match.icon;
    }
    return "fa-solid fa-link";
  }
  const cleanUrl = url.toLowerCase();
  const match = BRAND_MAPPING.find(b => cleanUrl.includes(b.domain));
  return match ? match.icon : "fa-solid fa-link";
};

// Helper: Get brand name from URL
const getBrandNameFromUrl = (url) => {
  if (!url || url.trim() === "") return "Custom Link";
  const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();
  
  const match = BRAND_MAPPING.find(b => cleanUrl.includes(b.domain));
  if (match) return match.name;

  // Fallback: extract domain name
  try {
    const domain = cleanUrl.split("/")[0];
    const parts = domain.split(".");
    if (parts.length > 1) {
      const name = parts[parts.length - 2];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  } catch (e) {}
  
  return "Link";
};

// Escape HTML utility
const escapeHtml = (text) => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Toast notification helper
const showToast = (message) => {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  if (!toast || !toastMessage) return;
  
  toastMessage.textContent = message;
  toast.classList.add("show");
  
  if (window.toastTimeout) {
    clearTimeout(window.toastTimeout);
  }
  
  window.toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
};

// Load fields from storage
const loadAllFromStorage = async () => {
  const defaultFields = [
    "Github",
    "Linkedin",
    "Twitter",
    "Portfolio",
    "Email",
    "Dev",
  ];

  // Retrieve fields
  storageGet(null, (items) => {
    let customFields = items.customFields;

    if (!customFields) {
      customFields = defaultFields;
      storageSet({ customFields });
    }

    // Set settings values
    settingUsernameInput.value = items.gitHubUsername || "";
    settingRepoInput.value = items.gitHubRepo || "LinkVault";

    // Clear UI and render
    linksDiv.innerHTML = "";
    customFields.forEach((field) => {
      renderFieldsFromStorage({ newFieldName: field, isNewField: false, initialValue: items[field] || "" });
    });
  });
};

// Render fields dynamically
const renderFieldsFromStorage = ({ newFieldName, isNewField, initialValue = "" }) => {
  const newField = document.createElement("div");
  newField.classList.add("profile-row");

  const newIcon = document.createElement("i");
  newIcon.classList.add("profile-icon");
  
  // Set initial icon based on URL or name mapping
  const initialIconClass = getIconForUrl(initialValue, newFieldName);
  newIcon.className = `profile-icon ${initialIconClass}`;

  // Create Input
  const newFieldInput = document.createElement("input");
  newFieldInput.classList.add("profile-input");
  newFieldInput.setAttribute("placeholder", `Enter ${newFieldName} URL`);
  newFieldInput.setAttribute("id", newFieldName);
  newFieldInput.value = initialValue;
  newFieldInput.setAttribute("type", "text");

  // Auto-save & dynamic icon updates on typing
  newFieldInput.addEventListener("input", (e) => {
    const val = e.target.value;
    storageSet({ [newFieldName]: val });
    
    // Dynamic icon updates based on what is typed
    const dynamicIconClass = getIconForUrl(val, newFieldName);
    newIcon.className = `profile-icon ${dynamicIconClass}`;
  });

  // Action: Copy Button
  const newFieldCopyBtn = document.createElement("button");
  newFieldCopyBtn.classList.add("action-btn");
  newFieldCopyBtn.setAttribute("title", "Copy to clipboard");
  newFieldCopyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
  newFieldCopyBtn.addEventListener("click", () => {
    copyToClipboard(newFieldInput.value, newFieldName);
  });

  // Action: Clear/Delete Button
  const newFieldDeleteBtn = document.createElement("button");
  newFieldDeleteBtn.classList.add("action-btn", "delete-btn");
  
  const isDefaultField = ["Github", "Linkedin", "Twitter", "Portfolio", "Email", "Dev"].includes(newFieldName);
  newFieldDeleteBtn.setAttribute("title", isDefaultField ? "Clear link" : "Remove custom field");
  newFieldDeleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
  
  newFieldDeleteBtn.addEventListener("click", () => {
    if (isDefaultField) {
      newFieldInput.value = "";
      storageSet({ [newFieldName]: "" });
      newIcon.className = `profile-icon ${getIconForUrl("", newFieldName)}`;
      showToast(`Cleared ${newFieldName} link`);
    } else {
      if (confirm(`Remove custom profile "${newFieldName}"?`)) {
        newField.remove();
        storageRemove(newFieldName);
        
        storageGet("customFields", (result) => {
          let fields = result.customFields || [];
          fields = fields.filter(f => f !== newFieldName);
          storageSet({ customFields: fields });
          showToast(`Removed "${newFieldName}"`);
        });
      }
    }
  });

  // Append elements
  newField.appendChild(newIcon);
  newField.appendChild(newFieldInput);
  newField.appendChild(newFieldCopyBtn);
  newField.appendChild(newFieldDeleteBtn);

  linksDiv.appendChild(newField);

  if (isNewField) {
    storageSet({ [newFieldName]: initialValue });
    storageGet("customFields", (result) => {
      let existingFields = result.customFields || [];
      existingFields.push(newFieldName);
      storageSet({ customFields: existingFields });
      showToast(`Added profile: ${newFieldName}`);
    });
  }
};

// Custom Profile Inline Flow UI Handling
add_new_button.addEventListener("click", () => {
  add_new_button.style.display = "none";
  addProfileForm.style.display = "flex";
  newProfileUrlInput.value = "";
  newProfileIcon.className = "profile-icon fa-solid fa-link";
  newProfileUrlInput.focus();
});

// Update form icon in real-time as user pastes/types
newProfileUrlInput.addEventListener("input", (e) => {
  const url = e.target.value;
  const detectedIcon = getIconForUrl(url);
  newProfileIcon.className = `profile-icon ${detectedIcon}`;
});

const handleConfirmAdd = () => {
  const url = newProfileUrlInput.value.trim();
  if (!url) {
    showToast("Please enter a URL first");
    return;
  }

  const baseName = getBrandNameFromUrl(url);
  
  storageGet("customFields", (result) => {
    const existingFields = result.customFields || [];
    let finalName = baseName;
    let counter = 2;
    
    while (existingFields.some(field => field.toLowerCase() === finalName.toLowerCase())) {
      finalName = `${baseName} ${counter}`;
      counter++;
    }

    renderFieldsFromLocalStorage({ newFieldName: finalName, isNewField: true, initialValue: url });
    
    // Close form
    addProfileForm.style.display = "none";
    add_new_button.style.display = "flex";
  });
};

confirmAddBtn.addEventListener("click", handleConfirmAdd);
newProfileUrlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleConfirmAdd();
  }
});

cancelAddBtn.addEventListener("click", () => {
  addProfileForm.style.display = "none";
  add_new_button.style.display = "flex";
});

// Settings Panel toggle and inputs save
toggleSettingsBtn.addEventListener("click", () => {
  if (settingsPanel.style.display === "none") {
    settingsPanel.style.display = "block";
    toggleSettingsBtn.style.color = "var(--accent)";
    toggleSettingsBtn.style.borderColor = "var(--border-focus)";
  } else {
    settingsPanel.style.display = "none";
    toggleSettingsBtn.style.color = "var(--text-secondary)";
    toggleSettingsBtn.style.borderColor = "var(--border-color)";
  }
});

settingUsernameInput.addEventListener("input", (e) => {
  storageSet({ gitHubUsername: e.target.value.trim() });
});

settingRepoInput.addEventListener("input", (e) => {
  storageSet({ gitHubRepo: e.target.value.trim() || "LinkVault" });
});

// --------------------- FEATURE 1: AUTOFILL JOB APPLICATIONS ---------------------
autofillBtn.addEventListener("click", async () => {
  if (!isExtension) {
    showToast("Autofill is only active within the Chrome Extension");
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    showToast("No active tab found");
    return;
  }

  // Get saved links
  storageGet(null, (items) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (linksData) => {
        const selectors = {
          Github: ['input[name*="github" i]', 'input[id*="github" i]', 'input[placeholder*="github" i]'],
          Linkedin: ['input[name*="linkedin" i]', 'input[id*="linkedin" i]', 'input[placeholder*="linkedin" i]'],
          Twitter: ['input[name*="twitter" i]', 'input[id*="twitter" i]', 'input[placeholder*="twitter" i]', 'input[name*="x.com" i]', 'input[placeholder*="x.com" i]'],
          Portfolio: [
            'input[name*="portfolio" i]', 
            'input[name*="website" i]', 
            'input[id*="portfolio" i]', 
            'input[placeholder*="portfolio" i]', 
            'input[placeholder*="website" i]',
            'input[name*="blog" i]',
            'input[name*="work_link" i]',
            'input[placeholder*="personal website" i]'
          ],
          Email: ['input[name*="email" i]', 'input[id*="email" i]', 'input[placeholder*="email" i]', 'input[type="email"]']
        };

        let fillCount = 0;
        Object.keys(selectors).forEach(field => {
          const value = linksData[field];
          if (value && value.trim() !== "") {
            const fieldSelectors = selectors[field];
            for (const selector of fieldSelectors) {
              const inputs = document.querySelectorAll(selector);
              inputs.forEach(input => {
                if (input && (input.tagName === "INPUT" || input.tagName === "TEXTAREA")) {
                  if (input.value !== value) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    fillCount++;
                  }
                }
              });
            }
          }
        });
        return fillCount;
      },
      args: [items]
    }).then((results) => {
      const filled = results[0]?.result || 0;
      if (filled > 0) {
        showToast(`Autofilled ${filled} fields!`);
      } else {
        showToast("No matching application fields found");
      }
    }).catch((err) => {
      console.error(err);
      showToast("Cannot autofill on this page");
    });
  });
});

// --------------------- FEATURE 2: GENERATE QUICK-SHARE LINK ---------------------
quickShareBtn.addEventListener("click", () => {
  storageGet(null, (items) => {
    const customFields = items.customFields || [];
    const shareData = {};

    customFields.forEach(field => {
      const url = items[field];
      if (url && url.trim() !== "") {
        shareData[field] = url;
      }
    });

    if (Object.keys(shareData).length === 0) {
      showToast("No links saved to share!");
      return;
    }

    const username = items.gitHubUsername || "";
    const repo = items.gitHubRepo || "LinkVault";

    if (!username) {
      showToast("Set GitHub Username in settings first!");
      settingsPanel.style.display = "block";
      toggleSettingsBtn.style.color = "var(--accent)";
      toggleSettingsBtn.style.borderColor = "var(--border-focus)";
      settingUsernameInput.focus();
      return;
    }

    try {
      const jsonStr = JSON.stringify(shareData);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      
      // Compile short, clean, trusted URL using the GitHub Pages deployment URL
      const finalUrl = `https://${username}.github.io/${repo}/share.html?p=${b64}`;

      navigator.clipboard.writeText(finalUrl).then(() => {
        showToast("Quick-Share Link copied!");
      }).catch(() => {
        showToast("Failed to copy link");
      });
    } catch (e) {
      console.error(e);
      showToast("Encoding failed");
    }
  });
});

// Initialize
document.addEventListener("DOMContentLoaded", loadAllFromStorage);
if (document.readyState === "interactive" || document.readyState === "complete") {
  loadAllFromStorage();
}
