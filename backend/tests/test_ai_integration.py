from types import SimpleNamespace

from services.ai_integration import AIClient


def test_extract_text_from_content_list():
    client = AIClient()
    response = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    content=[{"type": "text", "text": "{"}, {"type": "text", "text": '"ok":true}'}],
                    tool_calls=None,
                    function_call=None,
                )
            )
        ]
    )

    assert client._extract_text(response) == '{"ok":true}'


def test_extract_text_from_tool_call_arguments():
    client = AIClient()
    response = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(
                    content=None,
                    tool_calls=[
                        SimpleNamespace(
                            function=SimpleNamespace(arguments='{"plan_name":"A"}'),
                            model_dump_json=lambda: '{"fallback":true}',
                        )
                    ],
                    function_call=None,
                )
            )
        ]
    )

    assert client._extract_text(response) == '{"plan_name":"A"}'
