// 文件上传处理

const FileUpload = {
    // 拖拽状态
    isDragging: false,
    dragCounter: 0,

    // 初始化文件上传
    init() {
        this.bindEvents();
        this.createDragOverlay();
        this.setupClipboardListener();
    },

    // 绑定事件
    bindEvents() {
        const fileInput = document.getElementById('fileInput');
        const fileButton = document.getElementById('fileButton');

        // 点击文件按钮
        if (fileButton) {
            fileButton.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // 文件选择（支持多文件）
        fileInput.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // 全局拖拽事件
        document.addEventListener('dragenter', this.handleDragEnter.bind(this));
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('dragleave', this.handleDragLeave.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));

        // 阻止浏览器默认的拖拽行为
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    },
    
    // 创建拖拽覆盖层
    createDragOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'dragOverlay';
        overlay.className = 'drag-overlay';
        overlay.innerHTML = `
            <div class="drag-content">
                <div class="drag-icon">📁</div>
                <div class="drag-text">拖拽文件到此处上传</div>
                <div class="drag-hint">支持多文件同时上传</div>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    // 设置剪贴板监听
    setupClipboardListener() {
        document.addEventListener('paste', this.handlePaste.bind(this));

        // 添加键盘快捷键提示
        this.addKeyboardHints();
    },

    // 处理文件选择（支持多文件）
    async handleFileSelect(files) {
        if (!files || files.length === 0) return;

        // 批量上传文件
        await this.uploadMultipleFiles(Array.from(files));
    },

    // 处理拖拽进入
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter++;

        if (e.dataTransfer.types.includes('Files')) {
            this.showDragOverlay();
            this.updateDragOverlayContent(e.dataTransfer.items);
        }
    },

    // 处理拖拽悬停
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.types.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy';
        }
    },

    // 处理拖拽离开
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter--;

        if (this.dragCounter === 0) {
            this.hideDragOverlay();
        }
    },

    // 处理文件拖拽放下
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();

        this.dragCounter = 0;
        this.hideDragOverlay();

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // 显示放下动画
            this.showDropAnimation();
            this.handleFileSelect(files);
        }
    },

    // 处理剪贴板粘贴
    async handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        const files = [];
        let hasFiles = false;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                    hasFiles = true;
                }
            }
        }

        if (hasFiles) {
            e.preventDefault();

            // 显示粘贴提示
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const shortcut = isMac ? 'Cmd+V' : 'Ctrl+V';
            UI.showKeyboardHint(`📋 检测到 ${shortcut} 粘贴了 ${files.length} 个文件`, 2000);

            await this.uploadMultipleFiles(files);
        }
    },
    
    // 显示拖拽覆盖层
    showDragOverlay() {
        const overlay = document.getElementById('dragOverlay');
        if (overlay) {
            overlay.classList.add('active');
            document.body.classList.add('dragging');
            this.isDragging = true;
        }
    },

    // 隐藏拖拽覆盖层
    hideDragOverlay() {
        const overlay = document.getElementById('dragOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.classList.remove('dragging');
            this.isDragging = false;
        }
    },

    // 更新拖拽覆盖层内容 - 支持文件类型图标显示
    updateDragOverlayContent(dataTransferItems) {
        const overlay = document.getElementById('dragOverlay');
        if (!overlay) return;

        const dragIcon = overlay.querySelector('.drag-icon');
        const dragText = overlay.querySelector('.drag-text');
        const dragHint = overlay.querySelector('.drag-hint');

        if (!dataTransferItems || dataTransferItems.length === 0) {
            dragIcon.textContent = '📁';
            dragText.textContent = '拖拽文件到此处上传';
            dragHint.textContent = '支持多文件同时上传';
            return;
        }

        const fileCount = dataTransferItems.length;

        // 获取文件信息并显示相应图标
        const fileIcons = [];
        const fileTypes = new Set();

        for (let i = 0; i < Math.min(dataTransferItems.length, 3); i++) {
            const item = dataTransferItems[i];
            if (item.kind === 'file') {
                // 尝试从MIME类型获取图标
                let icon = Utils.getFileIcon(item.type);

                // 如果没有MIME类型，尝试从文件名获取
                if (icon === CONFIG.FILE_ICONS.default && item.getAsFile) {
                    const file = item.getAsFile();
                    if (file && file.name) {
                        icon = Utils.getFileIconByName(file.name);
                    }
                }

                fileIcons.push(icon);
                fileTypes.add(this.getFileTypeCategory(item.type, item.getAsFile?.()?.name));
            }
        }

        // 显示图标
        if (fileIcons.length === 1) {
            dragIcon.textContent = fileIcons[0];
        } else if (fileIcons.length > 1) {
            // 多文件时显示前几个图标
            dragIcon.innerHTML = fileIcons.slice(0, 3).join(' ');
        } else {
            dragIcon.textContent = '📁';
        }

        // 更新文本
        if (fileCount > 1) {
            const typeText = fileTypes.size === 1 ?
                Array.from(fileTypes)[0] : '多种类型';
            dragText.textContent = `拖拽 ${fileCount} 个${typeText}文件到此处上传`;
            dragHint.textContent = '支持批量上传';
        } else {
            const typeText = fileTypes.size > 0 ? Array.from(fileTypes)[0] : '';
            dragText.textContent = `拖拽${typeText}文件到此处上传`;
            dragHint.textContent = '支持多文件同时上传';
        }
    },

    // 获取文件类型分类（用于显示友好的类型名称）
    getFileTypeCategory(mimeType, fileName) {
        if (mimeType) {
            if (mimeType.startsWith('image/')) return '图片';
            if (mimeType.startsWith('video/')) return '视频';
            if (mimeType.startsWith('audio/')) return '音频';
            if (mimeType.includes('pdf')) return 'PDF';
            if (mimeType.includes('word') || mimeType.includes('document')) return '文档';
            if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '表格';
            if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '演示';
            if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return '压缩';
            if (mimeType.startsWith('text/')) return '文本';
        }

        if (fileName) {
            const ext = Utils.getFileExtension(fileName);
            if (ext) {
                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) return '图片';
                if (['mp4', 'avi', 'mov', 'wmv', 'mkv', 'flv'].includes(ext)) return '视频';
                if (['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(ext)) return '音频';
                if (['pdf'].includes(ext)) return 'PDF';
                if (['doc', 'docx'].includes(ext)) return '文档';
                if (['xls', 'xlsx'].includes(ext)) return '表格';
                if (['ppt', 'pptx'].includes(ext)) return '演示';
                if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '压缩';
                if (['txt', 'md', 'html', 'css', 'js', 'json'].includes(ext)) return '文本';
            }
        }

        return '';
    },

    // 显示放下动画
    showDropAnimation() {
        const overlay = document.getElementById('dragOverlay');
        if (overlay) {
            const content = overlay.querySelector('.drag-content');
            content.style.transform = 'scale(1.1)';
            content.style.background = '#e8f5e8';

            setTimeout(() => {
                content.style.transform = 'scale(1)';
                content.style.background = 'white';
            }, 200);
        }
    },

    // 添加键盘快捷键提示（已禁用）
    addKeyboardHints() {
        // 所有文件上传提示已禁用，保持界面简洁
        return;
    },

    // 批量上传文件
    async uploadMultipleFiles(files) {
        if (!files || files.length === 0) return;

        // 验证所有文件
        const validFiles = [];
        const invalidFiles = [];

        for (const file of files) {
            if (this.validateFile(file)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file);
            }
        }

        // 显示无效文件警告
        if (invalidFiles.length > 0) {
            const reasons = invalidFiles.map(f => {
                if (!Utils.validateFileSize(f.size)) {
                    return `${f.name} (文件过大)`;
                }
                return `${f.name} (不支持的格式)`;
            });
            UI.showError(`以下文件无法上传：${reasons.join(', ')}`);
        }

        if (validFiles.length === 0) return;

        // 显示批量上传状态
        this.showBatchUploadStatus(validFiles.length);

        // 逐个上传文件
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < validFiles.length; i++) {
            try {
                await this.uploadSingleFile(validFiles[i], i + 1, validFiles.length);
                successCount++;
            } catch (error) {
                failCount++;
                console.error(`文件 ${validFiles[i].name} 上传失败:`, error);
            }
        }

        // 隐藏上传状态
        this.hideBatchUploadStatus();

        // 显示结果
        if (successCount > 0) {
            UI.showSuccess(`成功上传 ${successCount} 个文件`);

            // 添加延迟确保数据库写入完成
            setTimeout(async () => {
                await MessageHandler.loadMessages(true); // 强制滚动到底部
            }, 500);
        }

        if (failCount > 0) {
            UI.showError(`${failCount} 个文件上传失败`);
        }

        // 清空文件输入
        this.clearFileInput();
    },

    // 上传单个文件
    async uploadSingleFile(file, current, total) {
        const deviceId = Utils.getDeviceId();

        // 更新当前上传进度显示
        this.updateBatchProgress(file.name, current, total);

        // 上传文件（带进度）
        const result = await API.uploadFile(file, deviceId, (progress) => {
            this.updateFileProgress(progress);
        });

        return result;
    },

    // 验证单个文件
    validateFile(file) {
        // 验证文件大小
        if (!Utils.validateFileSize(file.size)) {
            return false;
        }

        // 验证文件类型（如果需要）
        if (!this.validateFileType(file)) {
            return false;
        }

        return true;
    },
    

    // 显示批量上传状态
    showBatchUploadStatus(fileCount) {
        const statusElement = document.getElementById('uploadStatus');
        if (statusElement) {
            statusElement.style.display = 'flex';
            statusElement.innerHTML = `
                <div class="upload-spinner">⏳</div>
                <div class="upload-info">
                    <div class="upload-text">正在上传 ${fileCount} 个文件...</div>
                    <div class="upload-current" id="uploadCurrent"></div>
                </div>
                <div class="upload-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                </div>
            `;
        }
    },

    // 隐藏批量上传状态
    hideBatchUploadStatus() {
        const statusElement = document.getElementById('uploadStatus');
        if (statusElement) {
            statusElement.style.display = 'none';
        }
    },

    // 更新批量上传进度 - 显示文件图标
    updateBatchProgress(fileName, current, total) {
        const currentElement = document.getElementById('uploadCurrent');
        if (currentElement) {
            // 获取文件图标
            const fileIcon = Utils.getFileIconByName(fileName);

            // 截断长文件名
            const displayName = fileName.length > 30 ?
                fileName.substring(0, 27) + '...' : fileName;

            currentElement.innerHTML = `正在上传: ${fileIcon} ${displayName} (${current}/${total})`;
        }
    },

    // 更新文件上传进度
    updateFileProgress(progress) {
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    },

    // 清空文件输入
    clearFileInput() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
            // 确保支持多文件选择
            if (!fileInput.hasAttribute('multiple')) {
                fileInput.setAttribute('multiple', 'true');
            }
        }
    },

    // 验证文件类型（如果需要限制）
    validateFileType(file) {
        // 目前允许所有文件类型
        return true;
    },

    // 获取文件预览（如果是图片）
    getFilePreview(file) {
        return new Promise((resolve) => {
            if (!Utils.isImageFile(file.type)) {
                resolve(null);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }
};
