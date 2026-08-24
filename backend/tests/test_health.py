from server import app


def test_app_is_created():
    assert app.title == "react-backend-api"
