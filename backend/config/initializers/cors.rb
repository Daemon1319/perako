# Local development uses the Vite proxy. Set FRONTEND_URL for a separate frontend.
frontend_url = ENV["FRONTEND_URL"]

if frontend_url.present?
  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins frontend_url
      resource "*",
        headers: :any,
        methods: %i[get post put patch delete options head]
    end
  end
end
