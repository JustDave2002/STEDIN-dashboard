package k8sclient

import (
	"context"
	"fmt"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
)

// DeployAppToDevice deploys an application container to an existing pod
func DeployAppToDevice(ctx context.Context, clientset *kubernetes.Clientset, namespace string, deviceID int64, appID int64, imageName string) (string, error) {
	// Create a unique deployment name
	deploymentName := fmt.Sprintf("edge-device-%d-app-%d", deviceID, appID)

	// Normalize deviceID to calculate a NodePort within the valid range
	nodePort := int32(30000 + (deviceID % 2768)) // Ensures NodePort is between 30000–32767

	// Define the deployment
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      deploymentName,
			Namespace: namespace,
			Labels: map[string]string{
				"device_id": fmt.Sprintf("%d", deviceID),
				"app_id":    fmt.Sprintf("%d", appID),
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(1),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"device_id": fmt.Sprintf("%d", deviceID),
					"app_id":    fmt.Sprintf("%d", appID),
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"device_id": fmt.Sprintf("%d", deviceID),
						"app_id":    fmt.Sprintf("%d", appID),
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  fmt.Sprintf("app-%d", appID),
							Image: imageName,
							Ports: []corev1.ContainerPort{
								{ContainerPort: 5000},
							},
						},
					},
				},
			},
		},
	}

	// Create or update the deployment
	_, err := clientset.AppsV1().Deployments(namespace).Create(ctx, deployment, metav1.CreateOptions{})
	if err != nil {
		if errors.IsAlreadyExists(err) {
			_, err = clientset.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
			if err != nil {
				return "", fmt.Errorf("failed to update deployment for device %d: %w", deviceID, err)
			}
		} else {
			return "", fmt.Errorf("failed to create deployment for device %d: %w", deviceID, err)
		}
	}

	// Create or update the corresponding service
	serviceName := fmt.Sprintf("%s-service", deploymentName)
	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      serviceName,
			Namespace: namespace,
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{
				"device_id": fmt.Sprintf("%d", deviceID),
				"app_id":    fmt.Sprintf("%d", appID),
			},
			Ports: []corev1.ServicePort{
				{
					Protocol:   corev1.ProtocolTCP,
					Port:       5000,
					TargetPort: intstr.FromInt(5000),
					NodePort:   nodePort,
				},
			},
			Type: corev1.ServiceTypeNodePort,
		},
	}

	_, err = clientset.CoreV1().Services(namespace).Create(ctx, service, metav1.CreateOptions{})
	if err != nil {
		if errors.IsAlreadyExists(err) {
			_, err = clientset.CoreV1().Services(namespace).Update(ctx, service, metav1.UpdateOptions{})
			if err != nil {
				return "", fmt.Errorf("failed to update service for device %d: %w", deviceID, err)
			}
		} else {
			return "", fmt.Errorf("failed to create service for device %d: %w", deviceID, err)
		}
	}

	// Generate the application URL
	switch appID {
	case 3:
		appPath := fmt.Sprintf("http://localhost:%d/measurements", nodePort)
		return appPath, nil
	default:
		appPath := fmt.Sprintf("http://localhost:%d", nodePort)
		return appPath, nil
	}

}

// int32Ptr returns a pointer to an int32 value
func int32Ptr(i int32) *int32 {
	return &i
}
