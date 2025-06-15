import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Text,
  FormControl,
  FormLabel,
  Textarea,
  Button,
  Heading,
  Grid,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import axios from 'axios';

interface PromptTemplate {
  name: string;
  template: string;
  example: string;
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [animationUrl, setAnimationUrl] = useState('');
  const [error, setError] = useState('');
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);

  const generateAnimation = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt before generating an animation.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setAnimationUrl('');

      const response = await axios.post('http://localhost:3001/generate-animation', { prompt });
      setAnimationUrl(`http://localhost:3001${response.data.videoUrl}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage || 'Failed to generate animation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    axios.get('http://localhost:3001/prompt-templates')
      .then(response => setPromptTemplates(response.data))
      .catch(error => {
        console.error('Error fetching templates:', error);
        setError('Failed to load prompt templates. Please refresh the page to try again.');
      });
  }, []);

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading>Manim Animation Generator</Heading>
            <Text>Enter a prompt to generate a 2D animation using Manim</Text>
          </Box>

          <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
            {/* Left column: Prompt input and templates */}
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Animation Prompt</FormLabel>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the animation you want to create..."
                  size="lg"
                  rows={4}
                  isDisabled={isLoading}
                />
              </FormControl>

              <Button
                colorScheme="blue"
                size="lg"
                onClick={generateAnimation}
                isLoading={isLoading}
              >
                Generate Animation
              </Button>

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}

              {/* Prompt Templates */}
              <Box mt={4}>
                <Heading size="md" mb={4}>Prompt Templates</Heading>
                <VStack spacing={4} align="stretch">
                  {promptTemplates.map((template, index) => (
                    <Box
                      key={index}
                      p={4}
                      borderRadius="md"
                      bg="white"
                      shadow="sm"
                      cursor="pointer"
                      onClick={() => setPrompt(template.template)}
                      _hover={{ shadow: 'md' }}
                    >
                      <Text fontWeight="bold">{template.name}</Text>
                      <Text color="gray.600" fontSize="sm">{template.template}</Text>
                      <Text color="gray.500" fontSize="xs" mt={2}>Example: {template.example}</Text>
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>

            {/* Right column: Animation preview */}
            <Box>
              <Box
                borderRadius="md"
                overflow="hidden"
                bg="white"
                shadow="md"
                p={4}
                height={{ base: "300px", md: "500px" }}
              >
                {animationUrl ? (
                  <video
                    src={animationUrl}
                    controls
                    width="100%"
                    height="100%"
                    style={{ objectFit: 'contain' }}
                    autoPlay
                  />
                ) : (
                  <Box
                    height="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="gray.50"
                    borderRadius="md"
                    border="2px dashed"
                    borderColor="gray.200"
                  >
                    <VStack spacing={4}>
                      <Text color="gray.500">
                        {isLoading ? 'Generating animation...' : 'Animation will appear here'}
                      </Text>
                      {isLoading && <Spinner size="xl" color="blue.500" />}
                    </VStack>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </VStack>
      </Container>
    </Box>
  );
}

export default App;
