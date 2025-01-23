package k8sclient

import (
	"fmt"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// InitK8sClient initializes the Kubernetes clientset and returns it
func InitK8sClient(config *rest.Config) (*kubernetes.Clientset, error) {
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kubernetes client: %v", err)
	}
	fmt.Println("Successfully connected to Kubernetes!")
	return clientset, nil
}
