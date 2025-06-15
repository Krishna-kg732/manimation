from manim import *
import json
import os
import sys
import re

class AnimationGenerator:
    def __init__(self, output_dir="media/videos"):
        self.output_dir = output_dir
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
    def validate_code(self, code):
        """
        Basic validation of the generated code to prevent malicious code execution and common LLM errors.
        """
        # Check for suspicious imports or system calls
        suspicious_patterns = [
            r'import\s+os',
            r'import\s+sys',
            r'import\s+subprocess',
            r'__import__',
            r'add_coordinate_labels',  # Known-bad method for your Manim version
        ]
        for pattern in suspicious_patterns:
            if re.search(pattern, code):
                raise ValueError(f"Generated code contains forbidden or invalid pattern: {pattern}")
        return True

    def sanitize_code(self, code):
        """
        Sanitize code to fix invalid escape sequences in string literals.
        """
        # Replace single backslashes in string literals with double backslashes
        def fix_escapes(match):
            s = match.group(0)
            # Only replace if not already a raw string
            if not s.startswith('r'):
                s = s.replace('\\', '\\\\')
            return s
        # This regex matches string literals
        code = re.sub(r'([ru]?"[^"]*"|[ru]?\'[^"]*\')', fix_escapes, code)
        return code
    
    def generate_animation_from_code(self, code, prompt):
        """
        Generates an animation from provided Manim code.
        Args:
            code (str): The Manim Python code to execute
            prompt (str): The prompt that generated the code (used for filename)
        """
        try:
            # Validate the code
            self.validate_code(code)
            
            # Extract the scene class name
            scene_class_match = re.search(r'class\s+(\w+)\(Scene\)', code)
            if not scene_class_match:
                raise ValueError("Could not find Scene class name")
            
            scene_class_name = scene_class_match.group(1)
            
            # Configure Manim
            config.media_dir = self.output_dir
            config.video_dir = self.output_dir
            config.output_file = f"animation_{hash(prompt) & 0xffffffff}"
            config.format = "mp4"
            config.quality = "medium_quality"
            config.save_last_frame = False
            
            # Create output directory if it doesn't exist
            os.makedirs(self.output_dir, exist_ok=True)
            
            # Sanitize code
            code = self.sanitize_code(code)
            
            # Execute the code in a restricted scope
            namespace = {
                '__name__': '__main__',
                'Scene': Scene,
                'Circle': Circle,
                'Square': Square,
                'Triangle': Triangle,
                'Text': Text,
                'Tex': Tex,
                'MathTex': MathTex,
                'Create': Create,
                'Write': Write,
                'FadeIn': FadeIn,
                'FadeOut': FadeOut,
                'Transform': Transform,
                'ReplacementTransform': ReplacementTransform,
                'AnimationGroup': AnimationGroup,
                'Rotate': Rotate,
                'UP': UP,
                'DOWN': DOWN,
                'LEFT': LEFT,
                'RIGHT': RIGHT,
                'ORIGIN': ORIGIN,
                'PI': PI,
                'TAU': TAU,
                'RED': RED,
                'GREEN': GREEN,
                'BLUE': BLUE,
                'YELLOW': YELLOW,
                'PURPLE': PURPLE,
                'ORANGE': ORANGE,
            }
            
            # Execute the code
            exec(code, namespace)
            
            # Get the scene class from our namespace
            scene_class = namespace.get(scene_class_name)
            if not scene_class:
                raise ValueError(f"Scene class {scene_class_name} not found in executed code")
            
            # Create and render the scene
            scene = scene_class()
            scene.render()
            
            # Return the path to the generated video
            video_path = os.path.join(self.output_dir, f"animation_{hash(prompt) & 0xffffffff}.mp4")
            return video_path
            
        except Exception as e:
            print(f"Error generating animation: {str(e)}", file=sys.stderr)
            raise
    
    def generate_test_animation(self):
        """
        Generates a simple test animation with a circle that grows and fades in.
        """
        scene_code = """
class TestScene(Scene):
    def construct(self):
        circle = Circle()
        circle.set_fill(BLUE, opacity=0.5)
        
        self.play(
            Create(circle),
            circle.animate.scale(2),
        )
        self.play(FadeOut(circle))
"""
        
        # Configure Manim
        config.media_dir = self.output_dir
        config.video_dir = self.output_dir
        config.output_file = "test_animation"
        config.format = "mp4"
        config.quality = "medium_quality"
        config.save_last_frame = False
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Execute the scene code
        namespace = {
            '__name__': '__main__',
            'Scene': Scene,
            'Circle': Circle,
            'Create': Create,
            'FadeOut': FadeOut,
            'BLUE': BLUE,
        }
        
        exec(scene_code, namespace)
        
        # Create and render the scene
        scene = namespace['TestScene']()
        scene.render()
        
        # Return the path to the generated video
        return os.path.join(self.output_dir, "test_animation.mp4")
