/*
 * UI generators
 * Vanilla JS + Bootstrap v5.3+
 */

  let globalTheme = 'light';

  function createBaseElement(tag, props = {})
{
  const {text, className, children, theme, ...restProps} = props;

  const el = document.createElement(tag);

  if (className) el.className = className;
  if (text) el.textContent = text;

  if (theme && typeof theme === 'string') {
    el.setAttribute('data-bs-theme', theme);
  }

  for (const [key, value] of Object.entries(restProps)) {
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.substring(2).toLowerCase();
      el.addEventListener(eventName, value);
    } else if (typeof value === 'boolean') {
      el.toggleAttribute(key, value);
    } else if (value !== undefined && value !== null) {
      el.setAttribute(key, value);
    }
  }

  if (children) {
    const childrenArray = Array.isArray(children) ? children : [children];
    // childrenArray.forEach(child => {
    //   if (child) {
    //     if (child instanceof HTMLElement) {
    //       el.appendChild(child);
    //     } else {
    //       el.appendChild(document.createTextNode(child));
    //     }
    //   }
    // });

    // filtered null/undefined
    const validChildren = childrenArray.filter(child => child !== null && child !== undefined);
    el.append(...validChildren);
  }
  return el;
}

// --- API ---
const MyUI = {
  setGlobalTheme (themeName) {
    if (themeName !== 'light' && themeName !== 'dark') return;

    globalTheme = themeName;
    document.documentElement.setAttribute('data-bs-theme', globalTheme);
    console.log(`[myUI] Global theme changed on: ${globalTheme}`);
  },

  getGlobalTheme () {
    return globalTheme;
  },

  toggleTheme () {
    const newTheme = globalTheme === 'light' ? 'dark' : 'light';
    this.setGlobalTheme(newTheme);
    return newTheme;
  },

  Tag(tagName, props) {
    return createBaseElement(tagName, props);
  },

  Button(props) {
    const defClass = 'btn btn-primary';
    const className = props.className ? `${defClass} ${props.className}` : defClass;
    return createBaseElement('button', {...props, className});
  },

  Input(props) {
    const defClass = 'form-control';
    const className = props.className ? `${defClass} ${props.className}` : defClass;
    return createBaseElement('input', {...props, className});
  },

  Card(props) {
    const {title, content, meta, children, className, ...restProps} = props;

    const cardClass = `card h-100 ${className || ''}`.trim();

    const $card = createBaseElement('div', {...restProps, className: cardClass});
    const $cardBody = createBaseElement('div', {className: 'card-body d-flex flex-column'});

    if (meta) {
      $cardBody.append(createBaseElement('div', {
        text: meta,
        className: 'text-body-secondary small mb-2',
      }));
    }

    if (title) {
      $cardBody.append(createBaseElement('h5', {text: title, className: 'card-title'}));
    }

    if (content) {
      $cardBody.append(createBaseElement('p', {text: content, className: 'card-text'}));
    }

    if (children) {
      const childrenArray = Array.isArray(children) ? children : [children];
      const validChildren = childrenArray.filter(child => child instanceof HTMLElement);
      $cardBody.append(...validChildren);
    }

    $card.append($cardBody);
    return $card;
  }
};

export default MyUI;