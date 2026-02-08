// Markdown 处理模块
// 负责 Markdown 视图切换和渲染逻辑

const MarkdownHandler = {
    // 切换Markdown视图
    toggleView(messageId) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) {
            console.warn('消息元素未找到:', messageId);
            return;
        }

        const isCurrentlyRendered = messageElement.dataset.isRendered === 'true';
        const originalContent = messageElement.dataset.original;
        const renderedContent = messageElement.dataset.rendered.replace(/&quot;/g, '"');

        // 清除现有内容
        messageElement.innerHTML = '';

        if (isCurrentlyRendered) {
            // 切换到源码视图
            const textNode = document.createTextNode(originalContent);
            messageElement.appendChild(textNode);
            messageElement.className = 'text-message';
            messageElement.dataset.isRendered = 'false';
        } else {
            // 切换到渲染视图
            messageElement.innerHTML = renderedContent;
            messageElement.className = 'text-message markdown-rendered';
            messageElement.dataset.isRendered = 'true';
        }

        // 重新添加切换按钮
        const toggleButton = document.createElement('button');
        toggleButton.className = 'markdown-toggle';
        toggleButton.onclick = () => this.toggleView(messageId);
        toggleButton.title = '切换源码/渲染视图';
        toggleButton.textContent = '📝';
        messageElement.appendChild(toggleButton);
    },

    // 检查是否包含 Markdown 语法
    hasMarkdownSyntax(text) {
        return Utils.markdown.hasMarkdownSyntax(text);
    },

    // 渲染 Markdown 为 HTML
    renderToHtml(text) {
        return Utils.markdown.renderToHtml(text);
    }
};
