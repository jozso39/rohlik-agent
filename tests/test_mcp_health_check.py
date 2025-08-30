"""
Test for MCP health check functionality
"""
import pytest
import httpx
from unittest.mock import patch, Mock
from src.utils.mcp_health_check import check_mcp_server_sync

@pytest.fixture
def mock_successful_response():
    """Mock a successful MCP server response"""
    mock_response = Mock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "recipes": [
            {"name": "Test Recipe 1"},
            {"name": "Test Recipe 2"}
        ]
    }
    return mock_response

@pytest.fixture
def mock_failed_response():
    """Mock a failed MCP server response"""
    mock_response = Mock()
    mock_response.status_code = 500
    return mock_response

class TestMCPHealthCheck:
    """Test suite for MCP health check functionality"""
    
    def test_successful_health_check(self, mock_successful_response):
        """Test successful MCP server health check"""
        with patch('httpx.Client') as mock_client:
            mock_client.return_value.__enter__.return_value.get.return_value = mock_successful_response
            
            result = check_mcp_server_sync("http://test-server:8001")
            
            assert result is True
            mock_client.return_value.__enter__.return_value.get.assert_called_once_with(
                "http://test-server:8001/get_recipes"
            )
    
    def test_failed_health_check_bad_status(self, mock_failed_response):
        """Test health check with bad status code"""
        with patch('httpx.Client') as mock_client:
            mock_client.return_value.__enter__.return_value.get.return_value = mock_failed_response
            
            result = check_mcp_server_sync("http://test-server:8001")
            
            assert result is False
    
    def test_health_check_connection_error(self):
        """Test health check with connection error"""
        with patch('httpx.Client') as mock_client:
            mock_client.return_value.__enter__.return_value.get.side_effect = httpx.ConnectError("Connection failed")
            
            result = check_mcp_server_sync("http://test-server:8001")
            
            assert result is False
    
    def test_health_check_timeout(self):
        """Test health check with timeout"""
        with patch('httpx.Client') as mock_client:
            mock_client.return_value.__enter__.return_value.get.side_effect = httpx.TimeoutException("Request timed out")
            
            result = check_mcp_server_sync("http://test-server:8001")
            
            assert result is False
    
    def test_health_check_with_default_url(self, mock_successful_response):
        """Test health check with default URL from environment"""
        with patch('httpx.Client') as mock_client, \
             patch.dict('os.environ', {'MCP_BASE_URL': 'http://localhost:8001'}):
            mock_client.return_value.__enter__.return_value.get.return_value = mock_successful_response
            
            result = check_mcp_server_sync()
            
            assert result is True
            mock_client.return_value.__enter__.return_value.get.assert_called_once_with(
                "http://localhost:8001/get_recipes"
            )
