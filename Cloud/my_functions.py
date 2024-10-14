import json

def handler(event, context):
    # Example response for testing
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello, this is a Python function deployed on Netlify!',
        })
    }
