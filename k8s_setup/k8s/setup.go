package k8s

import (
	"context"
	"fmt"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

var Ctx = context.Background()

func Setupk8s() {
	// Create a context

	// Get kubeconfig path from environment variable or use default
	kubeconfig := "/mnt/c/Users/lucag/.kube/config"

	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		panic(fmt.Errorf("failed to load kubeconfig: %v", err))
	}

	// Create the clientset
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(fmt.Errorf("failed to create Kubernetes client: %v", err))
	}

	// Test connection
	fmt.Println("Successfully connected to Kubernetes!")

	// Test: List all namespaces
	namespaces, err := clientset.CoreV1().Namespaces().List(Ctx, metav1.ListOptions{})
	if err != nil {
		panic(fmt.Errorf("failed to list namespaces: %v", err))
	}

	fmt.Println("Namespaces:")
	for _, ns := range namespaces.Items {
		fmt.Println("- " + ns.Name)
	}
}

var clientset *kubernetes.Clientset

// Initialize Kubernetes client
func InitK8sClient(config *rest.Config) error {
	var err error
	clientset, err = kubernetes.NewForConfig(config)
	if err != nil {
		return fmt.Errorf("failed to create Kubernetes client: %v", err)
	}
	return nil
}

// DeployNginx creates a simple Nginx deployment
func DeployNginx(ctx context.Context, namespace string) error {
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name: "nginx-deployment",
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(2),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{"app": "nginx"},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{"app": "nginx"},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "nginx",
							Image: "nginx:latest",
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: 80,
								},
							},
						},
					},
				},
			},
		},
	}

	// Create the deployment in the specified namespace
	_, err := clientset.AppsV1().Deployments(namespace).Create(ctx, deployment, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create deployment: %v", err)
	}

	fmt.Println("Nginx deployment created successfully")
	return nil
}

// CreateNamespace creates a namespace in the Kubernetes cluster
func CreateNamespace(ctx context.Context, namespace string) error {
	_, err := clientset.CoreV1().Namespaces().Create(ctx, &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespace,
		},
	}, metav1.CreateOptions{})
	if err != nil {
		if apierrors.IsAlreadyExists(err) {
			fmt.Printf("Namespace %s already exists\n", namespace)
			return nil
		}
		return fmt.Errorf("failed to create namespace: %v", err)
	}

	fmt.Printf("Namespace %s created successfully\n", namespace)
	return nil
}

// DeployEdgeDevice deploys a pod to simulate an edge device
func DeployEdgeDevice(ctx context.Context, namespace, name string, deviceID int64) (string, error) {
	podName := fmt.Sprintf("edge-device-%d", deviceID) // Unique pod name using device_id

	// Define the pod spec
	pod := &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      podName,
			Namespace: namespace,
			Labels: map[string]string{
				"role":        "edge-device",
				"device_name": name,
				"device_id":   fmt.Sprintf("%d", deviceID),
			},
		},
		Spec: corev1.PodSpec{
			Containers: []corev1.Container{
				{
					Name:  "device-agent",
					Image: "nginx:latest", // Simulating a base device agent
					Ports: []corev1.ContainerPort{
						{ContainerPort: 80},
					},
				},
			},
		},
	}

	// Create the pod
	_, err := clientset.CoreV1().Pods(namespace).Create(ctx, pod, metav1.CreateOptions{})
	if err != nil {
		return "", fmt.Errorf("failed to deploy edge device pod: %w", err)
	}

	// Generate and return the pod URL
	url := fmt.Sprintf("http://localhost:30000/%s", podName) // Adjust if using NodePort services
	return url, nil
}

// ListEdgeDevices lists all pods simulating edge devices in the namespace
func ListEdgeDevices(ctx context.Context, namespace string) ([]corev1.Pod, error) {
	pods, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: "role=edge-device",
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list edge devices: %v", err)
	}

	return pods.Items, nil
}

// Helper function to get a pointer to an int32 value
func int32Ptr(i int32) *int32 {
	return &i
}
