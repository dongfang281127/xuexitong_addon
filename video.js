// video.js - 修复动态加载的视频模块
console.log("🎬 视频模块已挂载");

const VideoWorker = {
    isFinished: false,
    
    play: function(speed = 2.0) {
        if (this.isFinished) return;
        
        // 尝试寻找视频元素
        const video = document.querySelector('video') || document.querySelector('.vjs-tech');
        
        if (!video) {
            console.log("⏳ 视频元素还在加载中，1秒后重试...");
            setTimeout(() => this.play(speed), 1000);
            return;
        }

        // 绑定事件 (确保只绑一次)
        if (!video.dataset.binded) {
            video.dataset.binded = "true";
            
            video.addEventListener('ended', () => {
                console.log("🏁 视频播放完毕！");
                this.isFinished = true;
                window.parent.postMessage({ action: "TASK_FINISHED", type: "video" }, '*');
            });
            
            // 防暂停
            video.addEventListener('pause', () => {
                if (!video.ended && !this.isFinished) {
                    setTimeout(() => video.play(), 500);
                }
            });
        }

        // 强制静音并设置倍速
        video.muted = true;
        video.playbackRate = speed;
        
        if (video.paused && !video.ended) {
            video.play().catch(e => console.log("播放被拦截", e));
        }
    }
};

window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'START_VIDEO') {
        VideoWorker.play(event.data.speed || 2.0);
    }
});