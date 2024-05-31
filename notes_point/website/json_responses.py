from typing import Any, Dict


def default_response_template(content: Any = None,
                              message: Any = None) -> Dict[str, Any]:
    return {"content": content, "message": message}



    