// 图片加载模块
// 负责异步图片加载和错误处理

const ImageLoader = {
    // 异步加载图片
    async load(r2Key, safeId) {
        try {
            // 如果没有提供safeId，则生成一个
            if (!safeId) {
                safeId = this.createSafeId(r2Key);
            }

            // 获取相关元素
            const loadingElement = document.getElementById(`loading-${safeId}`);
            const imageElement = document.getElementById(`img-${safeId}`);
            const errorElement = document.getElementById(`error-${safeId}`);

            if (!loadingElement || !imageElement || !errorElement) {
                console.warn('图片元素未找到:', r2Key);
                return;
            }

            // 显示加载状态
            loadingElement.style.display = 'flex';
            imageElement.style.display = 'none';
            errorElement.style.display = 'none';

            // 获取图片blob URL
            const blobUrl = await API.getImageBlobUrl(r2Key);

            // 设置图片源并等待加载完成
            await new Promise((resolve, reject) => {
                imageElement.onload = resolve;
                imageElement.onerror = reject;
                imageElement.src = blobUrl;
            });

            // 显示图片，隐藏加载状态
            loadingElement.style.display = 'none';
            imageElement.style.display = 'block';

        } catch (error) {
            console.error('图片加载失败:', error);
            this.showError(r2Key, safeId);
        }
    },

    // 显示错误状态
    showError(r2Key, safeId) {
        const safeIdToUse = safeId || this.createSafeId(r2Key);
        const loadingElement = document.getElementById(`loading-${safeIdToUse}`);
        const imageElement = document.getElementById(`img-${safeIdToUse}`);
        const errorElement = document.getElementById(`error-${safeIdToUse}`);

        if (loadingElement) loadingElement.style.display = 'none';
        if (imageElement) imageElement.style.display = 'none';
        if (errorElement) errorElement.style.display = 'flex';
    },

    // 重试加载图片
    async retry(r2Key, safeId) {
        // 清除可能存在的缓存
        if (typeof API !== 'undefined' && API.revokeImageBlobUrl) {
            API.revokeImageBlobUrl(r2Key);
        }

        // 重新加载
        await this.load(r2Key, safeId);
    },

    // 创建安全的ID（移除特殊字符）
    createSafeId(str) {
        return str.replace(/[^a-zA-Z0-9-_]/g, '');
    }
};
