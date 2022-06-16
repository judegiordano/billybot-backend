import * as Eta from "eta";

type TemplateName = "account-created" | "password-reset";

const templateLookup: Record<TemplateName, { text: string; html: string }> = {
	"account-created": {
		text: "Account Created",
		html: "<p>Welcome to your new account, <%= it.username %>!</p>"
	},
	"password-reset": {
		text: "Password Reset",
		html: "<p>Here is your temporary password: <%= it.temporaryPassword %></p>"
	}
};

export const renderTemplate = async (templateName: TemplateName, options?: Record<any, any>) => {
	const { text, html } = templateLookup[templateName];
	const template = await Eta.render(html, { ...options });
	return {
		text,
		html: template as string
	};
};
