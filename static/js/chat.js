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
const user_image = `<img src="${url_prefix}/static/img/user.png" alt="User Avatar">`;
const bot_image = `<img src="${url_prefix}/static/img/bot.png" alt="Bot Avatar">`;
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

			// Ajouter le message de l'utilisateur
			add_user_message_box(message);

			// Ajouter la conversation
			add_conversation(window.conversation_id, message.substr(0, 16));
			window.scrollTo(0, 0);

			window.controller = new AbortController();
			const jailbreak = document.getElementById("jailbreak");
			const model = document.getElementById("model");
			const provider = document.getElementById("provider");

			prompt_lock = true;
			window.text = '';
			window.token = message_id(); // Assurez-vous que cette fonction est définie

			stop_generating.classList.remove('stop-generating-hidden');

			// Ajouter la boîte de message pour le bot
			message_box.innerHTML += `
					<div class="message">
							<div class="avatar-container">
									${bot_image}
							</div>
							<div class="content" id="gpt_${window.token}">
									<div id="cursor"></div>
							</div>
					</div>
			`;

			message_box.scrollTop = message_box.scrollHeight;
			window.scrollTo(0, 0);
			await new Promise((r) => setTimeout(r, 500));
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
					window.text += chunk;

					// Mettre à jour le message du bot
					document.getElementById(`gpt_${window.token}`).innerHTML = markdown.render(window.text);
					document.querySelectorAll('code').forEach((el) => {
							hljs.highlightElement(el);
					});

					message_box.scrollTop = message_box.scrollHeight;
			}

			// Ajouter le message du bot après la fin de la lecture
			add_bot_message_box(window.text);

			message_box.scrollTop = message_box.scrollHeight;
			await remove_cancel_button();
			prompt_lock = false;

			await load_conversations(20, 0);
			window.scrollTo(0, 0);
	} catch (e) {
			// Gestion des erreurs
			console.error(e);
			add_message(window.conversation_id, "user", message);
			add_message(window.conversation_id, "assistant", "An error occurred, please try again.");
			await remove_cancel_button();
			prompt_lock = false;
			await load_conversations(20, 0);
			window.scrollTo(0, 0);
	}
};

const add_user_message_box = (message) => {
	const messageDiv = document.createElement('div');
	messageDiv.className = 'message user';
	messageDiv.innerHTML = `
			<div class="avatar-container">
					${user_image}
			</div>
			<div class="content">
					${message}
			</div>
	`;
	message_box.appendChild(messageDiv);
};

const add_bot_message_box = (message) => {
	const messageDiv = document.createElement('div');
	messageDiv.className = 'message bot';
	messageDiv.innerHTML = `
			<div class="avatar-container">
					${bot_image}
			</div>
			<div class="content">
					${message}
			</div>
	`;
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
					add_bot_message_box(content);
			}
	});
};

const load_conversations = async (limit, offset, reload = false) => {
	const conversations = JSON.parse(localStorage.getItem('conversations') || '[]');

	if (reload) {
			await clear_conversations();
	}

	conversations.slice(offset, offset + limit).forEach(({ id, title }) => {
			const conversationDiv = document.createElement('div');
			conversationDiv.className = 'conversation';
			conversationDiv.innerHTML = `
					<a href="${url_prefix}/chat/${id}">
							<div class="conversation-title">${title}</div>
					</a>
			`;
			box_conversations.appendChild(conversationDiv);
	});
};

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

document.getElementById('send-button').addEventListener('click', handle_ask);
document.getElementById('delete-button').addEventListener('click', delete_conversations);
