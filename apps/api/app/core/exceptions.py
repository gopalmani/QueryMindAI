class QueryMindError(Exception):
    status_code = 500
    code = "internal_error"

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class InvalidRequestError(QueryMindError):
    status_code = 400
    code = "invalid_request"


class UnsafeSQLError(QueryMindError):
    status_code = 422
    code = "unsafe_sql"


class ProviderError(QueryMindError):
    status_code = 502
    code = "provider_error"


class DependencyError(QueryMindError):
    status_code = 503
    code = "dependency_unavailable"


class FeatureDisabledError(QueryMindError):
    status_code = 403
    code = "feature_disabled"


class NotFoundError(QueryMindError):
    status_code = 404
    code = "not_found"


class AuthenticationError(QueryMindError):
    status_code = 401
    code = "authentication_required"


class ConnectionSecurityError(QueryMindError):
    status_code = 400
    code = "connection_rejected"
