import { onRequestPost as __update_post_js_onRequestPost } from "C:\\Users\\Saed\\OneDrive\\Documents\\GitHub\\clamiqs-site\\functions\\update-post.js"

export const routes = [
    {
      routePath: "/update-post",
      mountPath: "/",
      method: "POST",
      middlewares: [],
      modules: [__update_post_js_onRequestPost],
    },
  ]