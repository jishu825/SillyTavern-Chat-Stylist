// 检查必要依赖
if (typeof jQuery === 'undefined') {
    console.error('Chat Stylist: jQuery is required but not loaded');
    throw new Error('jQuery is required for Chat Stylist extension');
}

import { Settings } from "./core/Settings.js";
import { StyleManager } from "./core/StyleManager.js";
import { EventManager } from "./core/EventManager.js";
import { StylePanel } from "./ui/StylePanel.js";
import { TabControl } from './ui/components/TabControl.js';
import { BubblePanel } from './ui/panels/BubblePanel.js';
import { TextPanel } from './ui/panels/TextPanel.js';

class ChatStylist {
    constructor() {
        try {
            this.MODULE_NAME = 'chat_stylist';
            if (!window.extension_settings) {
                window.extension_settings = {};
            }
            this.settings = this.initSettings();
            this.styleManager = this.initStyleManager();
            
            // 直接初始化UI
            this.initialize();
            console.debug('ChatStylist: Initialized successfully');
        } catch (error) {
            console.error('ChatStylist initialization failed:', error);
            throw error;
        }
    }

    initSettings() {
        const defaultSettings = {
            enabled: true,
            styles: {},
            themeStyles: {},
            chatStyles: {}
        };

        if (!window.extension_settings[this.MODULE_NAME]) {
            window.extension_settings[this.MODULE_NAME] = defaultSettings;
        }
        return window.extension_settings[this.MODULE_NAME];
    }

    initStyleManager() {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'chat-stylist-styles';
        document.head.appendChild(styleSheet);
        return styleSheet;
    }

    initialize() {
        console.debug('ChatStylist: Initializing...');
        try {
            this.addSettingsUI();
            this.bindEvents();
            console.debug('ChatStylist: Initialization complete');
        } catch (error) {
            console.error('ChatStylist: Initialization failed', error);
        }
    }

addSettingsUI() {
    const settingsHtml = `
        <div id="chat-stylist-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Chat Stylist</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="chat-stylist-controls">
                        <button id="chat-stylist-editor" class="menu_button">
                            <i class="fa-solid fa-palette"></i>
                            <span>样式编辑器</span>
                        </button>
                        <div class="flex-container">
                            <button id="chat-stylist-import" class="menu_button" title="导入样式">
                                <i class="fa-solid fa-file-import"></i>
                            </button>
                            <button id="chat-stylist-export" class="menu_button" title="导出样式">
                                <i class="fa-solid fa-file-export"></i>
                            </button>
                            <button id="chat-stylist-reset" class="menu_button" title="重置样式">
                                <i class="fa-solid fa-rotate-left"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    
    // 将扩展设置添加到页面的设置区域
    $('#extensions_settings2').append(settingsHtml);

    // 绑定悬浮面板的事件
    $('#chat-stylist-editor').on('click', () => {
        this.showStyleEditor(); // 点击时显示面板
    });

    // 导入、导出、重置等其他功能
    $('#chat-stylist-import').on('click', () => this.importStyles());
    $('#chat-stylist-export').on('click', () => this.exportStyles());
    $('#chat-stylist-reset').on('click', () => {
        if (confirm('确定要重置所有样式设置吗？')) {
            this.resetStyles();
        }
    });
}

    bindSettingsControls() {
        $('#chat-stylist-editor').on('click', () => {
            this.showStyleEditor();
        });

        $('#chat-stylist-import').on('click', () => {
            this.importStyles();
        });

        $('#chat-stylist-export').on('click', () => {
            this.exportStyles();
        });

        $('#chat-stylist-reset').on('click', () => {
            if (confirm('确定要重置所有样式设置吗？')) {
                this.resetStyles();
            }
        });
    }

    bindEvents() {
        const waitForEventSource = async () => {
            for (let i = 0; i < 20; i++) {
                if (window.eventSource) {
                    window.eventSource.on('chatChanged', () => {
                        console.debug('ChatStylist: Chat changed');
                        this.applyStylesToChat();
                    });

                    window.eventSource.on('settingsUpdated', () => {
                        this.applyStylesToChat();
                    });
                    
                    console.debug('ChatStylist: Successfully bound to eventSource');
                    return;
                }
                
                if (i === 0) {
                    console.warn('ChatStylist: Waiting for eventSource...');
                }
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.error('ChatStylist: eventSource not available after 20 seconds');
        };

        // 延迟2秒后开始等待
        setTimeout(() => {
            waitForEventSource();
        }, 2000);
    }

    applyStylesToChat() {
        try {
            if (!this.settings.enabled) return;

            let styles = '';
            // 应用样式逻辑
            if (this.styleManager && this.styleManager.textContent !== undefined) {
                this.styleManager.textContent = styles;
            }
        } catch (error) {
            console.error('ChatStylist: Failed to apply styles:', error);
        }
    }

    showStyleEditor() {
        if (!this.styleEditor) {
            this.styleEditor = new StylePanel({
                onSave: (style) => this.saveStyles(style),
                onReset: () => this.resetStyles(),
                onClose: () => this.styleEditor.hide(),
            });
        }
        this.styleEditor.show();
    }

    /**
 * 使面板可拖动
 */
makeDraggable(element, dragHandle) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    dragHandle.style.cursor = 'move'; // 设置鼠标样式

    dragHandle.addEventListener('mousedown', (event) => {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        const rect = element.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        document.body.style.userSelect = 'none'; // 禁止文本选择
    });

    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        element.style.left = `${initialX + deltaX}px`;
        element.style.top = `${initialY + deltaY}px`;
        element.style.transform = 'none'; // 移动后取消初始居中
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = ''; // 恢复文本选择
        }
    });
}

    /**
 * 使面板可缩放
 */
makeResizable(element, resizeHandle) {
    let isResizing = false;
    let startWidth, startHeight, startX, startY;

    resizeHandle.addEventListener('mousedown', (event) => {
        isResizing = true;
        startWidth = element.offsetWidth;
        startHeight = element.offsetHeight;
        startX = event.clientX;
        startY = event.clientY;
        document.body.style.userSelect = 'none'; // 禁止文本选择
    });

    document.addEventListener('mousemove', (event) => {
        if (!isResizing) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        element.style.width = `${startWidth + deltaX}px`;
        element.style.height = `${startHeight + deltaY}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.userSelect = ''; // 恢复文本选择
        }
    });
}
    
    importStyles() {
        console.log('Import clicked');
    }

    exportStyles() {
        console.log('Export clicked');
    }

    resetStyles() {
        this.settings = this.initSettings();
        this.applyStylesToChat();
        if (window.saveSettingsDebounced) {
            window.saveSettingsDebounced();
        }
    }
}

// 初始化扩展
jQuery(async () => {
    try {
        window.chatStylist = new ChatStylist();
    } catch (error) {
        console.error('Failed to initialize Chat Stylist:', error);
    }
});
