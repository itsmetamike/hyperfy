# Hyperfy Framework Summary

### Core Architecture
Hyperfy is a powerful 3D web framework built on modern web technologies. It uses a system-based architecture where functionality is modularized into systems that register with a central World system.

### Key Systems
1. **World System**: Central orchestrator managing all other systems
2. **Asset Management**: Sophisticated asset loading and caching system
3. **Physics System**: PhysX integration for realistic physics
4. **System Architecture**: Modular, extensible system-based design
5. **Rendering System**: Three.js-based rendering with advanced features

### Technology Stack
- **3D Engine**: Three.js
- **Physics**: NVIDIA PhysX
- **Asset Formats**: GLB, VRM, HDR
- **Architecture**: System-based modular design

### Best Practices
- Use system-based architecture for new features
- Leverage asset:// protocol for resource loading
- Implement proper physics integration
- Follow established patterns for system lifecycle

### Development Workflow
1. Create new system extending base System class
2. Register system with World
3. Implement lifecycle methods (init, start)
4. Use world instance for cross-system communication

This framework provides a robust foundation for building complex 3D web applications with a focus on performance, modularity, and developer experience.
