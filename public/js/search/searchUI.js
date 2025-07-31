// 搜索UI模块 - 提供搜索界面和交互功能

const SearchUI = {
    // 组件状态
    isInitialized: false,
    isVisible: false,
    currentQuery: '',
    currentFilters: { ...CONFIG.SEARCH.DEFAULT_FILTERS },
    searchHistory: [],
    searchResults: [],
    isSearching: false,
    searchTimeout: null,

    // 初始化搜索UI
    init() {
        if (this.isInitialized) {
            return;
        }

        this.loadSearchHistory();
        this.createSearchModal();
        this.bindEvents();
        this.isInitialized = true;
    },

    // 创建搜索模态框
    createSearchModal() {
        // 检查是否已存在
        const existingModal = document.getElementById('searchModal');
        if (existingModal) {
            return;
        }

        const modalHTML = `
            <div class="search-modal" id="searchModal">
                <div class="search-modal-overlay"></div>
                <div class="search-modal-content">
                    <!-- 搜索头部 -->
                    <div class="search-header">
                        <div class="search-input-container">
                            <input type="text" 
                                   id="searchInput" 
                                   class="search-input" 
                                   placeholder="🔍 搜索消息和文件..."
                                   autocomplete="off">
                            <button class="search-clear-btn" id="searchClearBtn" style="display: none;">
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                                </svg>
                            </button>
                        </div>
                        <button class="search-close-btn" id="searchCloseBtn">
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                            </svg>
                        </button>
                    </div>

                    <!-- 搜索过滤器 -->
                    <div class="search-filters" id="searchFilters">
                        <div class="search-filter-group">
                            <label>类型:</label>
                            <select id="searchTypeFilter">
                                <option value="all">全部</option>
                                <option value="text">文本</option>
                                <option value="file">文件</option>
                            </select>
                        </div>

                        <div class="search-filter-group">
                            <label>文件类型:</label>
                            <select id="searchFileTypeFilter">
                                <option value="all">全部</option>
                                <option value="image">图片</option>
                                <option value="video">视频</option>
                                <option value="audio">音频</option>
                                <option value="document">文档</option>
                                <option value="archive">压缩包</option>
                                <option value="text">文本</option>
                                <option value="code">代码</option>
                            </select>
                        </div>

                        <div class="search-filter-group">
                            <label>时间:</label>
                            <select id="searchTimeFilter">
                                <option value="all">全部时间</option>
                                <option value="today">今天</option>
                                <option value="yesterday">昨天</option>
                                <option value="week">最近一周</option>
                                <option value="month">最近一月</option>
                                <option value="custom">自定义</option>
                            </select>
                        </div>

                        <button class="search-filter-toggle" id="searchFilterToggle">
                            筛选 <span class="toggle-icon">▼</span>
                        </button>
                    </div>

                    <!-- 搜索建议/历史 -->
                    <div class="search-suggestions" id="searchSuggestions" style="display: none;">
                        <div class="suggestions-header">
                            <span>搜索建议</span>
                            <button class="clear-history-btn" id="clearHistoryBtn">清除历史</button>
                        </div>
                        <div class="suggestions-list" id="suggestionsList"></div>
                    </div>

                    <!-- 搜索结果 -->
                    <div class="search-results" id="searchResults">
                        <div class="search-status" id="searchStatus">
                            <div class="search-welcome">
                                <div class="search-welcome-icon">🔍</div>
                                <div class="search-welcome-text">输入关键词开始搜索</div>
                                <div class="search-welcome-tips">
                                    <div>• 支持消息内容和文件名搜索</div>
                                    <div>• 可按文件类型和时间筛选</div>
                                    <div>• 支持模糊匹配和关键词高亮</div>
                                </div>
                            </div>
                        </div>
                        <div class="search-results-list" id="searchResultsList"></div>
                        <div class="search-load-more" id="searchLoadMore" style="display: none;">
                            <button class="load-more-btn">加载更多结果</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },

    // 绑定事件
    bindEvents() {
        // 搜索输入事件
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.executeSearch(e.target.value);
                } else if (e.key === 'Escape') {
                    this.hideSearchModal();
                }
            });

            searchInput.addEventListener('focus', () => {
                this.showSuggestions();
            });
        }

        // 清除搜索按钮
        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }

        // 关闭按钮
        const closeBtn = document.getElementById('searchCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideSearchModal();
            });
        }

        // 过滤器事件
        const typeFilter = document.getElementById('searchTypeFilter');
        const fileTypeFilter = document.getElementById('searchFileTypeFilter');
        const timeFilter = document.getElementById('searchTimeFilter');

        if (typeFilter) {
            typeFilter.addEventListener('change', () => {
                this.updateFilters();
            });
        }

        if (fileTypeFilter) {
            fileTypeFilter.addEventListener('change', () => {
                this.updateFilters();
            });
        }

        if (timeFilter) {
            timeFilter.addEventListener('change', () => {
                this.updateFilters();
            });
        }

        // 过滤器展开/收起
        const filterToggle = document.getElementById('searchFilterToggle');
        if (filterToggle) {
            filterToggle.addEventListener('click', () => {
                this.toggleFilters();
            });
        }

        // 清除历史按钮
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearSearchHistory();
            });
        }

        // 遮罩层点击关闭
        const overlay = document.querySelector('.search-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.hideSearchModal();
            });
        }

        // 建议项点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.suggestion-item')) {
                const suggestion = e.target.closest('.suggestion-item');
                const query = suggestion.dataset.query;
                this.executeSearch(query);
            }
        });

        // 搜索结果点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.search-result-item')) {
                const resultItem = e.target.closest('.search-result-item');
                this.handleResultClick(resultItem);
            }
        });

        // 加载更多按钮
        const loadMoreBtn = document.querySelector('.load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreResults();
            });
        }
    },

    // 显示搜索模态框
    showSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.classList.add('show');
            this.isVisible = true;

            // 聚焦搜索输入框
            setTimeout(() => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);

            // 显示搜索历史
            this.showSuggestions();
        }
    },

    // 隐藏搜索模态框
    hideSearchModal() {
        const modal = document.getElementById('searchModal');
        if (modal) {
            modal.classList.remove('show');
            this.isVisible = false;

            // 清理状态
            this.clearSearch();
        }
    },

    // 处理搜索输入
    handleSearchInput(query) {
        this.currentQuery = query;

        // 显示/隐藏清除按钮
        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) {
            clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        }

        // 防抖搜索
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (query.length >= CONFIG.SEARCH.MIN_QUERY_LENGTH) {
            this.searchTimeout = setTimeout(() => {
                this.executeSearch(query);
            }, CONFIG.SEARCH.DEBOUNCE_DELAY);

            // 隐藏建议，显示搜索状态
            this.hideSuggestions();
            this.showSearching();
        } else {
            // 显示建议
            this.showSuggestions();
            this.hideSearchResults();
        }
    },

    // 执行搜索
    async executeSearch(query) {
        if (!query || query.trim().length < CONFIG.SEARCH.MIN_QUERY_LENGTH) {
            return;
        }

        try {
            this.isSearching = true;
            this.currentQuery = query.trim();

            // 添加到搜索历史
            this.addToSearchHistory(this.currentQuery);

            // 显示搜索状态
            this.showSearching();

            // 执行搜索
            const results = await SearchAPI.search(this.currentQuery, this.currentFilters);

            // 格式化结果
            this.searchResults = SearchAPI.formatSearchResults(results);

            // 显示结果
            this.displaySearchResults();

        } catch (error) {
            console.error('搜索执行失败:', error);
            this.showSearchError(error.message);
        } finally {
            this.isSearching = false;
        }
    },

    // 更新过滤器
    updateFilters() {
        const typeFilter = document.getElementById('searchTypeFilter');
        const fileTypeFilter = document.getElementById('searchFileTypeFilter');
        const timeFilter = document.getElementById('searchTimeFilter');

        if (typeFilter) {
            this.currentFilters.type = typeFilter.value;
        }

        if (fileTypeFilter) {
            this.currentFilters.fileType = fileTypeFilter.value;
        }

        if (timeFilter) {
            this.currentFilters.timeRange = timeFilter.value;
        }

        // 如果有当前查询，重新搜索
        if (this.currentQuery) {
            this.executeSearch(this.currentQuery);
        }
    },

    // 显示搜索中状态
    showSearching() {
        const searchStatus = document.getElementById('searchStatus');
        if (searchStatus) {
            searchStatus.innerHTML = `
                <div class="search-loading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">正在搜索 "${this.currentQuery}"...</div>
                </div>
            `;
            searchStatus.style.display = 'block';
        }

        this.hideSuggestions();
        this.hideSearchResults();
    },

    // 显示搜索结果
    displaySearchResults() {
        const searchStatus = document.getElementById('searchStatus');
        const searchResultsList = document.getElementById('searchResultsList');

        if (!searchResultsList) return;

        // 隐藏状态区域
        if (searchStatus) {
            searchStatus.style.display = 'none';
        }

        // 显示结果统计
        const resultCount = this.searchResults.length;
        const statsHTML = `
            <div class="search-results-stats">
                找到 ${resultCount} 条相关结果 
                ${this.currentQuery ? `(搜索: "${this.currentQuery}")` : ''}
            </div>
        `;

        // 生成结果列表
        let resultsHTML = '';
        if (resultCount === 0) {
            resultsHTML = `
                <div class="search-no-results">
                    <div class="no-results-icon">🔍</div>
                    <div class="no-results-text">没有找到相关结果</div>
                    <div class="no-results-tips">试试其他关键词或调整筛选条件</div>
                </div>
            `;
        } else {
            resultsHTML = this.searchResults.map(result => this.createResultItemHTML(result)).join('');
        }

        searchResultsList.innerHTML = statsHTML + resultsHTML;
        searchResultsList.style.display = 'block';
    },

    // 创建结果项HTML
    createResultItemHTML(result) {
        const highlightedContent = this.highlightSearchTerms(result.displayContent, this.currentQuery);
        
        let typeTag = '';
        if (result.isAIMessage) {
            typeTag = result.messageType === 'ai_thinking' ? 
                '<span class="result-type-tag ai-thinking">AI思考</span>' :
                '<span class="result-type-tag ai-response">AI回答</span>';
        } else if (result.type === 'file') {
            typeTag = '<span class="result-type-tag file">文件</span>';
        }

        let fileSizeInfo = '';
        if (result.fileSize) {
            fileSizeInfo = `<span class="file-size">${result.fileSize}</span>`;
        }

        return `
            <div class="search-result-item" data-message-id="${result.id}" data-type="${result.type}">
                <div class="result-icon">${result.icon}</div>
                <div class="result-content">
                    <div class="result-header">
                        <div class="result-type-info">
                            ${typeTag}
                            ${fileSizeInfo}
                        </div>
                        <div class="result-time">${result.formattedTime}</div>
                    </div>
                    <div class="result-text">${highlightedContent}</div>
                    ${result.fileName ? `<div class="result-filename">${this.highlightSearchTerms(result.fileName, this.currentQuery)}</div>` : ''}
                </div>
                <div class="result-actions">
                    <button class="result-locate-btn" title="定位到消息">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    // 高亮搜索关键词
    highlightSearchTerms(text, query) {
        if (!text || !query) return text;

        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, `<mark class="${CONFIG.SEARCH.HIGHLIGHT_CLASS}">$1</mark>`);
    },

    // 显示建议
    showSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        const suggestionsList = document.getElementById('suggestionsList');

        if (!suggestions || !suggestionsList) return;

        // 生成建议列表（搜索历史）
        let suggestionsHTML = '';
        if (this.searchHistory.length > 0) {
            suggestionsHTML = this.searchHistory.slice(0, 10).map(item => `
                <div class="suggestion-item" data-query="${item}">
                    <div class="suggestion-icon">🕒</div>
                    <div class="suggestion-text">${item}</div>
                </div>
            `).join('');
        } else {
            suggestionsHTML = `
                <div class="no-suggestions">
                    <div class="no-suggestions-text">暂无搜索历史</div>
                </div>
            `;
        }

        suggestionsList.innerHTML = suggestionsHTML;
        suggestions.style.display = 'block';
    },

    // 隐藏建议
    hideSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.style.display = 'none';
        }
    },

    // 隐藏搜索结果
    hideSearchResults() {
        const searchResultsList = document.getElementById('searchResultsList');
        if (searchResultsList) {
            searchResultsList.style.display = 'none';
        }
    },

    // 显示搜索错误
    showSearchError(message) {
        const searchStatus = document.getElementById('searchStatus');
        if (searchStatus) {
            const sanitizedMessage = this.sanitizeHTML(message);
            searchStatus.innerHTML = `
                <div class="search-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">搜索失败: ${sanitizedMessage}</div>
                    <button class="retry-btn" onclick="SearchUI.executeSearch('${this.currentQuery}')">重试</button>
                </div>
            `;
            searchStatus.style.display = 'block';
        }

        this.hideSuggestions();
        this.hideSearchResults();
    },

    // 清除搜索
    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }

        const clearBtn = document.getElementById('searchClearBtn');
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }

        this.currentQuery = '';
        this.searchResults = [];

        // 显示欢迎界面
        this.showWelcomeScreen();
    },

    // 显示欢迎界面
    showWelcomeScreen() {
        const searchStatus = document.getElementById('searchStatus');
        if (searchStatus) {
            searchStatus.innerHTML = `
                <div class="search-welcome">
                    <div class="search-welcome-icon">🔍</div>
                    <div class="search-welcome-text">输入关键词开始搜索</div>
                    <div class="search-welcome-tips">
                        <div>• 支持消息内容和文件名搜索</div>
                        <div>• 可按文件类型和时间筛选</div>
                        <div>• 支持模糊匹配和关键词高亮</div>
                    </div>
                </div>
            `;
            searchStatus.style.display = 'block';
        }

        this.hideSearchResults();
    },

    // 处理结果点击
    handleResultClick(resultItem) {
        const messageId = resultItem.dataset.messageId;
        const messageType = resultItem.dataset.type;

        // 关闭搜索模态框
        this.hideSearchModal();

        // 定位到对应消息
        if (window.MessageHandler && typeof MessageHandler.locateMessage === 'function') {
            MessageHandler.locateMessage(messageId);
        } else {
            // 备用方案：滚动到对应消息
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // 高亮显示
                messageElement.classList.add('message-highlight');
                setTimeout(() => {
                    messageElement.classList.remove('message-highlight');
                }, 3000);
            }
        }
    },

    // 添加到搜索历史
    addToSearchHistory(query) {
        if (!query || query.trim().length === 0) return;

        const trimmedQuery = query.trim();
        
        // 移除重复项
        this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);
        
        // 添加到开头
        this.searchHistory.unshift(trimmedQuery);
        
        // 限制历史记录数量
        if (this.searchHistory.length > CONFIG.SEARCH.HISTORY_LIMIT) {
            this.searchHistory = this.searchHistory.slice(0, CONFIG.SEARCH.HISTORY_LIMIT);
        }
        
        // 保存到本地存储
        this.saveSearchHistory();
    },

    // 清除搜索历史
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
        this.showSuggestions(); // 刷新建议显示
        UI.showSuccess(CONFIG.SUCCESS.SEARCH_HISTORY_CLEARED);
    },

    // 保存搜索历史
    saveSearchHistory() {
        try {
            localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('保存搜索历史失败:', error);
        }
    },

    // 加载搜索历史
    loadSearchHistory() {
        try {
            const stored = localStorage.getItem('searchHistory');
            if (stored) {
                this.searchHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('加载搜索历史失败:', error);
            this.searchHistory = [];
        }
    },

    // 切换过滤器显示
    toggleFilters() {
        const filters = document.getElementById('searchFilters');
        const toggle = document.getElementById('searchFilterToggle');
        
        if (filters && toggle) {
            filters.classList.toggle('expanded');
            const icon = toggle.querySelector('.toggle-icon');
            if (icon) {
                icon.textContent = filters.classList.contains('expanded') ? '▲' : '▼';
            }
        }
    },

    // Sanitize HTML to prevent XSS
    sanitizeHTML(html) {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = html;
        return tempDiv.innerHTML;
    }
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.SearchUI = SearchUI;
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchUI;
} 