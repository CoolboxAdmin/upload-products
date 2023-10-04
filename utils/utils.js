import axios from "axios";

export const utilsDatos = async (element, categoryId, vtexCookie, specs) => {
    const HeaderSeller = {
        Accept: "application/json",
        "Content-Type": "application/json",
        // VtexIdclientAutCookie: "eyJhbGciOiJFUzI1NiIsImtpZCI6IkRFMDNGNjAxNDZEN0RDRjEyQjMyOEI0QzgzOUI0RTVBODEwQUUwOUMiLCJ0eXAiOiJqd3QifQ.eyJzdWIiOiJqYmVycm9jYWxAcmFzaHBlcnUuY29tIiwiYWNjb3VudCI6InFhc3RvcmVmcm9udDg0MCIsImF1ZGllbmNlIjoiYWRtaW4iLCJzZXNzIjoiNGI1NTQzMTEtNzBiNC00MzA0LTk0MjQtY2QzYjAwNzA1NTkyIiwiZXhwIjoxNjk1ODQ5ODQ5LCJ1c2VySWQiOiJmNWViOWU2OC01OTQxLTQ2NzUtOTliYS03ZDgwNTZjYTE1MmYiLCJpYXQiOjE2OTU3NjM0NDksImlzcyI6InRva2VuLWVtaXR0ZXIiLCJqdGkiOiIzNmNlODZkZC1hYjcyLTQ1MGEtOGRlYS03NmNlNmZjZDkwYWUifQ.d-p35t9c-con3woC21XsbP4KfR-lT-9UR9JitBeXYceEJ-2sADPGJx0nwHB86YmGDk8A8cACh4udScLScTEmiQ",
        VtexIdclientAutCookie: vtexCookie,
    }
    try {
        // MARCA: Debe retornar el ID de la marca según el texto colocado, si no existe, debe ser creada
        let brandName = element.brandId
        let brandId = ''
        const brandsResponse = await axios.get(
            `https://${element.origin}.myvtex.com/api/catalog-seller-portal/brands`,
            { headers: HeaderSeller }
        )
        const listBrands = await brandsResponse.data.data
        for (const item of listBrands) {
            if (item.name == brandName) {
                brandId = item.id
            }
        }
        if (!brandId) {
            const createBrandResponse = await axios.post(
                `https://${element.origin}.myvtex.com/api/catalog-seller-portal/brands`,
                { "name": brandName, "isActive": true },
                { headers: HeaderSeller }
            )
            brandId = createBrandResponse.data.id
        }
        // SLUG: Modificar el nombre del producto para obtener un slug válido
        // Condiciones
        // 1. Reemplazar el signo de '$' por la palabra 'dollar'
        // 2. Reemplazar la letra 'ñ' por la letra 'n'
        // 3. Eliminar los caracteres especiales
        // 4. Convertir todo el texto a letras minúsculas
        // 5. Reemplazar espacios por guiones
        // 6. Agregar '/' adelante del slug
        let slug = await element.name
        slug = await slug.replace(/$/g, 'dollar')
        slug = await slug.replace(/ñ/g, 'n')
        slug = await slug.replace(/[^a-zA-Z0-9 ]/g, '')
        slug = await slug.toLowerCase()
        slug = await slug.replace(/ /g, '-')
        slug = '/' + slug
        // IMÁGENES: Lógica para obtener url de imágenes automáticamente según la cantidad de imágenes otogada en el XLS
        let listImages = []
        let listImagesIds = []
        for (let i = 0; i < element.imgcant; i++) {
            listImages.push(
                {
                    "id": `${element.origin}-${element.externalId}_${i + 1}.jpg`,
                    "url": `https://${element.origin}.vtexassets.com/assets/vtex.catalog-images/products/${element.origin}-${element.externalId}_${i + 1}.jpg`,
                    "alt": `${element.name} ${i + 1}`
                }
            )
            listImagesIds.push(`${element.origin}-${element.externalId}_${i + 1}.jpg`)
        }
        // CREAR ESPECIFICACIONES
        let specsSku = []
        for (const spec of specs) {
            specsSku.push({
                "name": spec.specificationField,
                "value": spec.specificationValue
            })
        }
        // CREAR PRODUCTO: Armar objeto del producto para crearse con todos los elementos anteriores y demás que aparecen en el XLS.
        // Luego debe capturar el ID del producto creado
        const productToCreate = {
            "status": "active",
            "name": element.name.length > 150 ? element.name.substring(0, 150) : element.name,
            "brandId": brandId.toString(),
            "categoryIds": [categoryId],
            "attributes": specsSku,
            "externalId": element.externalId.toString(),
            "slug": slug,
            "images": listImages,
            "skus": [
                {
                    "name": element.name,
                    "externalId": element.externalId.toString(),
                    "isActive": true,
                    "weight": element.weight,
                    "dimensions": {
                        "width": element.width,
                        "height": element.height,
                        "length": element.length
                    },
                    "images": listImagesIds
                }
            ],
            "origin": element.origin
        }
        console.log(productToCreate)
        const createProductResponse = await axios.post(
            `https://${element.origin}.myvtex.com/api/catalog-seller-portal/products`,
            productToCreate,
            { headers: HeaderSeller }
        )
        const productId = await createProductResponse.data.id
        // DESCRIPCIÓN: Actualizar descripción del producto creado
        const updateDescriptionResponse = await axios.put(
            `https://${element.origin}.myvtex.com/api/catalog-seller-portal/products/${productId}/description`,
            {
                "productId": productId,
                "description": element.description
            },
            { headers: HeaderSeller }
        )
        console.log(`Product've created with ID ${productId} (${element.externalId})`)
        return `Product've created with ID ${productId} (${element.externalId})`
    } catch (error) {
        console.log(`Error: ${error.message} (${element.externalId})`)
        return `Error: ${error.message} (${element.externalId})`
    }
}


