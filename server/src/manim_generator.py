from manim import *  # This imports all Manim components
import json
import os
import sys
import re
import argparse
import tempfile

class AnimationGenerator:
    def __init__(self, output_dir="media/videos"):
        self.output_dir = output_dir
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
    
    def sanitize_code(self, code):
        """
        Sanitize the generated code:
        - Fix invalid escape sequences
        - Ensure complete function blocks
        - Handle indentation issues
        """
        # Fix common invalid escape sequences
        escape_fixes = {
            r'\P': r'\\P',  # Fix \P escape sequence
            r'\A': r'\\A',
            r'\C': r'\\C',
            r'\M': r'\\M',
            r'\S': r'\\S',
            r'\B': r'\\B',
            r'\D': r'\\D',
            r'\E': r'\\E',
            r'\F': r'\\F',
            r'\G': r'\\G',
            r'\H': r'\\H',
            r'\I': r'\\I',
            r'\J': r'\\J',
            r'\K': r'\\K',
            r'\L': r'\\L',
            r'\N': r'\\N',
            r'\O': r'\\O',
            r'\Q': r'\\Q',
            r'\R': r'\\R',
            r'\T': r'\\T',
            r'\U': r'\\U',
            r'\V': r'\\V',
            r'\W': r'\\W',
            r'\X': r'\\X',
            r'\Y': r'\\Y',
            r'\Z': r'\\Z',
        }
        
        for seq, replacement in escape_fixes.items():
            code = code.replace(seq, replacement)
        
        # Add pass statement to empty function bodies
        lines = code.split("\n")
        i = 0
        while i < len(lines):
            line = lines[i]
            # Check for function definition
            if re.match(r'\s*def\s+\w+.*:', line):
                # Check if next line exists and is properly indented
                if i == len(lines) - 1 or not lines[i+1].strip() or not re.match(r'\s+', lines[i+1]):
                    # Insert pass statement
                    indent = re.match(r'(\s*)', line).group(1) + '    '
                    lines.insert(i + 1, f"{indent}pass")
            i += 1
            
        return "\n".join(lines)

    def validate_code(self, code):
        """
        Validate the code to ensure it's proper Manim code
        """
        # Use sanitize_code to fix common issues
        code = self.sanitize_code(code)
        
        # Further validation can be added here
        try:
            # Try to compile the code to check for syntax errors
            compile(code, "<string>", "exec")
            return True, code
        except SyntaxError as e:
            return False, f"Syntax error in generated code: {str(e)}"

    def generate_animation_from_code(self, code, prompt=""):
        """
        Generate an animation from Manim code.
        Takes a string of Python code that creates a Manim scene.
        Returns the path to the generated video.
        """
        try:
            # Validate the code
            valid, result = self.validate_code(code)
            if not valid:
                print(f"ERROR: {result}", file=sys.stderr)
                return None

            # Extract scene class name
            scene_match = re.search(r'class\s+(\w+)\s*\(\s*Scene\s*\)', code)
            if not scene_match:
                print("ERROR: No Scene class found in the code", file=sys.stderr)
                return None

            scene_name = scene_match.group(1)
            
            # Convert code to Python namespace
            namespace = {}
            
            # Execute the code in a temporary namespace
            try:
                exec(result, namespace)
            except Exception as e:
                print(f"ERROR: Code execution failed: {str(e)}", file=sys.stderr)
                return None

            # Get the scene class from the namespace
            scene_class = namespace.get(scene_name)
            if not scene_class:
                print(f"ERROR: Scene class '{scene_name}' not found", file=sys.stderr)
                return None

            # Create the output file path
            output_file = os.path.join(self.output_dir, f"{hash(prompt)}.mp4")
            
            # Render the scene to video file
            scene = scene_class()
            scene.render()
            
            return output_file
        
        except Exception as e:
            print(f"ERROR: Animation generation failed: {str(e)}", file=sys.stderr)
            return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manim Animation Generator")
    parser.add_argument('--code', type=str, help='Manim code to execute')
    parser.add_argument('--codefile', type=str, help='Path to file containing Manim code to execute')
    parser.add_argument('--prompt', type=str, help='Prompt that generated the code')
    args = parser.parse_args()

    code = None
    if args.codefile:
        with open(args.codefile, 'r', encoding='utf-8') as f:
            code = f.read()
    elif args.code:
        code = args.code

    if code and args.prompt:
        generator = AnimationGenerator(output_dir="media/videos")
        result = generator.generate_animation_from_code(code, args.prompt)
        if result:
            print(f"Animation video saved to: {result}")
        else:
            print("ERROR: Animation generation failed", file=sys.stderr)
    else:
        print("ERROR: --codefile or --code and --prompt arguments are required", file=sys.stderr)
