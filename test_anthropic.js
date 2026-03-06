// Script de prueba para verificar la conexión con Anthropic
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function testAnthropicConnection() {
    console.log('🔍 Verificando configuración...');

    // Verificar que existe la API key
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error('❌ ERROR: ANTHROPIC_API_KEY no está configurada en .env');
        process.exit(1);
    }

    console.log('✓ API Key encontrada en .env');
    console.log(`✓ API Key: ${process.env.ANTHROPIC_API_KEY.substring(0, 10)}...${process.env.ANTHROPIC_API_KEY.substring(process.env.ANTHROPIC_API_KEY.length - 5)}`);

    // Inicializar cliente
    const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log('✓ Cliente de Anthropic inicializado');

    try {
        console.log('\n🚀 Probando llamada a la API...');

        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: 'Hola, responde solo con "OK" si me recibes correctamente.'
                }
            ]
        });

        console.log('✅ ¡Conexión exitosa!');
        console.log('Respuesta de Claude:', response.content[0].text);
        console.log('\nModelo usado:', response.model);
        console.log('Tokens usados:', response.usage);

    } catch (error) {
        console.error('\n❌ ERROR al conectar con Anthropic:');
        console.error('Tipo de error:', error.constructor.name);
        console.error('Mensaje:', error.message);

        if (error.status) {
            console.error('Status HTTP:', error.status);
        }

        if (error.error) {
            console.error('Detalles del error:', JSON.stringify(error.error, null, 2));
        }

        console.error('\nStack trace completo:');
        console.error(error.stack);

        process.exit(1);
    }
}

testAnthropicConnection();
