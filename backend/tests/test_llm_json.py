from utils.llm_json import parse_llm_json


def test_parse_llm_json_with_code_fence():
    parsed = parse_llm_json(
        """```json
        {"plan_name":"A","weeks":[]}
        ```""",
        context="test",
    )
    assert parsed["plan_name"] == "A"
    assert parsed["weeks"] == []


def test_parse_llm_json_with_js_style_object():
    parsed = parse_llm_json(
        "{plan_name: 'A', periodization_model: 'linear', weeks: [], nutrition: {calories: 2400}}",
        context="test",
    )
    assert parsed["plan_name"] == "A"
    assert parsed["nutrition"]["calories"] == 2400


def test_parse_llm_json_with_wrapped_text():
    parsed = parse_llm_json(
        "下面是结果：\n{\"plan_name\":\"A\",\"weeks\":[]}\n已完成。",
        context="test",
    )
    assert parsed["plan_name"] == "A"


def test_parse_llm_json_with_think_block():
    parsed = parse_llm_json(
        "<think>先分析训练目标与分化方式</think>{\"plan_name\":\"A\",\"weeks\":[]}",
        context="test",
    )
    assert parsed["plan_name"] == "A"
