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

const getIconForUrl = (url, defaultName = "") => {
  if (!url) return "fa-solid fa-link";
  const cleanUrl = url.toLowerCase();
  const match = BRAND_MAPPING.find(b => cleanUrl.includes(b.domain));
  if (match) return match.icon;
  if (defaultName) {
    const nameMatch = BRAND_MAPPING.find(b => b.name.toLowerCase() === defaultName.toLowerCase());
    if (nameMatch) return nameMatch.icon;
  }
  return "fa-solid fa-link";
};

const escapeHtml = (text) => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

document.addEventListener("DOMContentLoaded", () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const profileDataB64 = urlParams.get('p');
    if (profileDataB64) {
      const decodedJson = decodeURIComponent(escape(atob(profileDataB64)));
      const data = JSON.parse(decodedJson);
      const container = document.getElementById("links-container");

      if (!container) return;

      Object.keys(data).forEach(field => {
        const url = data[field];
        if (url && url.trim() !== "") {
          const iconClass = getIconForUrl(url, field);
          const linkHtml = `
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="link-btn">
              <i class="brand-icon ${iconClass}"></i>
              <span>${escapeHtml(field)}</span>
              <i class="arrow-icon fa-solid fa-chevron-right"></i>
            </a>
          `;
          container.innerHTML += linkHtml;
        }
      });
    } else {
      document.getElementById("links-container").innerHTML = "<p class='error-msg'>No profile links provided.</p>";
    }
  } catch (e) {
    console.error(e);
    document.getElementById("links-container").innerHTML = "<p class='error-msg'>Failed to load profiles. Check if your URL is correct.</p>";
  }
});
