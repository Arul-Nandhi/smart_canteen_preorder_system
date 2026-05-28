from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    name = 'analytics'
    def ready(self):
        # Import signal handlers
        try:
            import analytics.signals  # noqa
        except Exception:
            pass
