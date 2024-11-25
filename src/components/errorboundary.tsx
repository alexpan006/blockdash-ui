import React, { Component, ReactNode } from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import { styled } from "@mui/system";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

const ErrorContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  textAlign: "center",
  padding: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1),
    height: "auto",
    paddingTop: theme.spacing(4),
  },
}));

const ErrorMessage = styled(Box)(({ theme }) => ({
  maxWidth: "600px",
  width: "100%",
  margin: "0 auto",
  padding: theme.spacing(2),
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(1),
    maxWidth: "90%",
  },
}));

const RetryButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    marginTop: theme.spacing(2),
    width: "100%",
  },
}));

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorMessage>
            <Typography variant="h4" component="h2" gutterBottom>
              Something went wrong.
            </Typography>
            <Typography variant="body1" gutterBottom>
              We encountered an unexpected error. Please try refreshing the
              page, or come back later.
            </Typography>
            <RetryButton
              variant="contained"
              color="primary"
              onClick={this.handleRetry}
            >
              Retry
            </RetryButton>
          </ErrorMessage>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
