const query = (obj) =>
	Object.keys(obj)
			.map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(obj[k]))
			.join("&");

const url_prefix = document.querySelector("body").getAttribute("data-urlprefix");
const markdown = window.markdownit({ html: true })
	.use(texmath, { engine: katex, delimiters: 'dollars', katexOptions: { macros: { "\\RR": "\\mathbb{R}" } } });

const message_box = document.getElementById('messages');
const message_input = document.getElementById('message-input');
const box_conversations = document.querySelector('.top');
const spinner = box_conversations.querySelector(".spinner");
const stop_generating = document.querySelector('.stop-generating');
const send_button = document.querySelector('#send-button');
const user_image = `<img src="${url_prefix}/assets/img/user.png" alt="User Avatar">`;
const gpt_image = `<img src="${url_prefix}/assets/img/gpt.png" alt="GPT Avatar">`;
let prompt_lock = false;

hljs.addPlugin(new CopyButtonPlugin());

message_input.addEventListener("blur", () => {
	window.scrollTo(0, 0);
});

message_input.addEventListener("focus", () => {
	document.documentElement.scrollTop = document.documentElement.scrollHeight;
});

const delete_conversations = async () => {
	localStorage.clear();
	await new_conversation();
};

const handle_ask = async () => {
	message_input.style.height = '80px';
	window.scrollTo(0, 0);
	let message = message_input.value;

	if (message.length > 0) {
			message_input.value = '';
			message_input.dispatchEvent(new Event("input"));
			await ask_gpt(message);
	}
};

const remove_cancel_button = async () => {
	stop_generating.classList.add('stop-generating-hiding');

	setTimeout(() => {
			stop_generating.classList.remove('stop-generating-hiding');
			stop_generating.classList.add('stop-generating-hidden');
	}, 300);
};

const ask_gpt = async (message) => {
	try {
			message_input.value = '';
			message_input.innerHTML = '';
			message_input.innerText = '';

			add_conversation(window.conversation_id, message.substr(0, 16));
			window.scrollTo(0, 0);
			window.controller = new AbortController();

			const jailbreak = document.getElementById("jailbreak");
			const model = document.getElementById("model");
			const provider = document.getElementById("provider");
			prompt_lock = true;
			window.text = '';
			window.token = message_id();

			stop_generating.classList.remove('stop-generating-hidden');

			add_user_message_box(message);

			message_box.scrollTop = message_box.scrollHeight;
			window.scrollTo(0, 0);
			await new Promise((r) => setTimeout(r, 500));
			window.scrollTo(0, 0);

			message_box.innerHTML += `
					<div class="message">
							<div class="avatar-container">
									${gpt_image}
							</div>
							<div class="content" id="gpt_${window.token}">
									<div id="cursor"></div>
							</div>
					</div>
			`;

			message_box.scrollTop = message_box.scrollHeight;
			window.scrollTo(0, 0);
			await new Promise((r) => setTimeout(r, 1000));
			window.scrollTo(0, 0);

			const response = await fetch(`${url_prefix}/backend-api/v2/conversation`, {
					method: 'POST',
					signal: window.controller.signal,
					headers: {
							"content-type": 'application/json',
							"accept": 'text/event-stream',
					},
					body: JSON.stringify({
							conversation_id: window.conversation_id,
							action: '_ask',
							model: model.options[model.selectedIndex].value,
							provider: provider.options[provider.selectedIndex].value,
							jailbreak: jailbreak.options[jailbreak.selectedIndex].value,
							meta: {
									id: window.token,
									content: {
											conversation: await get_conversation(window.conversation_id),
											internet_access: document.getElementById("switch").checked,
											content_type: "text",
											parts: [
													{
															content: message,
															role: "user",
													},
											],
									},
							},
					}),
			});

			const reader = response.body.getReader();
			let chunk = '';
			
			while (true) {
					const { value, done } = await reader.read();
					if (done) break;

					chunk += decodeUnicode(new TextDecoder().decode(value));

					if (chunk.includes(`<form id="challenge-form" action="${url_prefix}/backend-api/v2/conversation?`)) {
							chunk = 'Cloudflare token expired, please refresh the page.';
					}

					window.text += chunk;

					document.getElementById(`gpt_${window.token}`).innerHTML = markdown.render(window.text);
					document.querySelectorAll('code').forEach((el) => {
							hljs.highlightElement(el);
					});

					window.scrollTo(0, 0);
					message_box.scrollTo({ top: message_box.scrollHeight, behavior: "auto" });
			}

			if (window.text.includes('instead. Maintaining this website and API costs a lot of money')) {
					document.getElementById(`gpt_${window.token}`).innerHTML =
							"An error occurred, please reload / refresh cache and try again.";
			}

			add_message(window.conversation_id, "user", message);
			add_message(window.conversation_id, "assistant", window.text);

			message_box.scrollTop = message_box.scrollHeight;
			await remove_cancel_button();
			prompt_lock = false;

			await load_conversations(20, 0);
			window.scrollTo(0, 0);
	} catch (e) {
			add_message(window.conversation_id, "user", message);

			message_box.scrollTop = message_box.scrollHeight;
			await remove_cancel_button();
			prompt_lock = false;

			await load_conversations(20, 0);

			console.log(e);

			let cursorDiv = document.getElementById('cursor');
			if (cursorDiv) cursorDiv.parentNode.removeChild(cursorDiv);

			if (e.name !== 'AbortError') {
					let error_message = 'Oops! Something went wrong, please try again / reload. [stacktrace in console]';

					document.getElementById(`gpt_${window.token}`).innerHTML = error_message;
					add_message(window.conversation_id, "assistant", error_message);
			} else {
					document.getElementById(`gpt_${window.token}`).innerHTML += ' [aborted]';
					add_message(window.conversation_id, "assistant", window.text + ' [aborted]');
			}

			window.scrollTo(0, 0);
	}
};

const add_user_message_box = (message) => {
	const messageDiv = createElement('div', { classNames: ['message'] });
	const avatarContainer = createElement('div', {
			classNames: ['avatar-container'],
			innerHTML: user_image,
	});
	const contentDiv = createElement('div', {
			classNames: ['content'],
			id: `user_${window.token}`,
			textContent: message,
	});

	messageDiv.append(avatarContainer, contentDiv);
	message_box.appendChild(messageDiv);
};

const decodeUnicode = (str) => {
	return str.replace(/\\u([a-fA-F0-9]{4})/g, function (match, grp) {
			return String.fromCharCode(parseInt(grp, 16));
	});
};

const clear_conversations = async () => {
	const elements = box_conversations.childNodes;
	let index = elements.length;

	if (index > 0) {
			while (index--) {
					const element = elements[index];
					if (element.nodeType === Node.ELEMENT_NODE && element.tagName.toLowerCase() !== 'button') {
							box_conversations.removeChild(element);
					}
			}
	}
};

const clear_conversation = async () => {
	let messages = message_box.getElementsByTagName('div');

	while (messages.length > 0) {
			message_box.removeChild(messages[0]);
	}
};

const delete_conversation = async (conversation_id) => {
	localStorage.removeItem(`conversation:${conversation_id}`);

	if (window.conversation_id === conversation_id) {
			await new_conversation();
	}

	await load_conversations(20, 0, true);
};

const set_conversation = async (conversation_id) => {
	history.pushState({}, null, `${url_prefix}/chat/${conversation_id}`);
	window.conversation_id = conversation_id;

	await clear_conversation();
	await load_conversation(conversation_id);
	await load_conversations(20, 0, true);
};

const new_conversation = async () => {
	history.pushState({}, null, `${url_prefix}/chat/`);
	window.conversation_id = message_id();

	localStorage.setItem(`conversation:${window.conversation_id}`, JSON.stringify([]));

	await clear_conversation();
	await load_conversations(20, 0, true);
};

const get_conversation = async (conversation_id) => {
	const conversation = localStorage.getItem(`conversation:${conversation_id}`);
	return conversation ? JSON.parse(conversation) : [];
};

const add_conversation = async (conversation_id, title) => {
	const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');
	const existingIndex = conversations.findIndex((c) => c.id === conversation_id);

	if (existingIndex !== -1) {
			conversations[existingIndex] = { id: conversation_id, title };
	} else {
			conversations.push({ id: conversation_id, title });
	}

	localStorage.setItem('conversations', JSON.stringify(conversations));
	await load_conversations(20, 0, true);
};

const add_message = async (conversation_id, role, content) => {
	const conversation = await get_conversation(conversation_id);
	conversation.push({ role, content });

	localStorage.setItem(`conversation:${conversation_id}`, JSON.stringify(conversation));
};

const load_conversation = async (conversation_id) => {
	const conversation = await get_conversation(conversation_id);

	conversation.forEach(({ role, content }) => {
			if (role === 'user') {
					add_user_message_box(content);
			} else if (role === 'assistant') {
					add_message_box(content);
			}
	});
};

const load_conversations = async (limit = 20, offset = 0, fromStorage = false) => {
	let conversations = fromStorage
			? JSON.parse(localStorage.getItem('conversations') || '[]')
			: await fetch_conversations();

	conversations = conversations.slice(offset, offset + limit);

	clear_conversations();

	conversations.forEach(({ id, title }) => {
			const conversationDiv = createElement('div', {
					classNames: ['conversation'],
					textContent: title,
					onclick: () => set_conversation(id),
			});

			box_conversations.appendChild(conversationDiv);
	});
};

const fetch_conversations = async () => {
	// Assuming there's an API endpoint to fetch conversations
	const response = await fetch(`${url_prefix}/backend-api/v2/conversations`);
	return response.json();
};

const createElement = (tag, { classNames = [], id = '', innerHTML = '', textContent = '', onclick = null }) => {
	const el = document.createElement(tag);
	el.className = classNames.join(' ');
	el.id = id;
	el.innerHTML = innerHTML;
	el.textContent = textContent;
	if (onclick) el.addEventListener('click', onclick);
	return el;
};

// Event Listeners
send_button.addEventListener("click", handle_ask);

stop_generating.addEventListener('click', () => {
	window.controller.abort();
	stop_generating.classList.add('stop-generating-hidden');
	stop_generating.classList.remove('stop-generating-hiding');
});

document.getElementById('delete-button').addEventListener('click', delete_conversations);

// On page load
document.addEventListener('DOMContentLoaded', async () => {
	const urlParts = window.location.pathname.split('/');
	const conversation_id = urlParts[urlParts.length - 1];
	
	if (conversation_id) {
			await set_conversation(conversation_id);
	} else {
			await new_conversation();
	}

	await load_conversations(20, 0, true);
});
